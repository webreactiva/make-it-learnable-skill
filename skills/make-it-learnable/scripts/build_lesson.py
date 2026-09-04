#!/usr/bin/env python3
"""Assemble a lesson body into one self-contained HTML file, and check the
cross-references that are easy to get wrong when authoring by hand.

    python3 scripts/build_lesson.py body.html -o lesson.html --title "..."
    python3 scripts/build_lesson.py body.html --check-only

The checks exist because a broken reference (a <l-focus target> pointing at a
part that does not exist, a quiz with no answer) fails silently in the browser:
the page still renders, it just quietly stops teaching.
"""
import argparse, html, re, sys
from urllib.parse import quote
from html.parser import HTMLParser
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / "assets"

VOID = {"area","base","br","col","embed","hr","img","input","link","meta","source","track","wbr"}


class Node:
    __slots__ = ("tag", "attrs", "children", "parent", "text")
    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.parent = tag, attrs, parent
        self.children, self.text = [], []
    def get(self, k, d=None): return self.attrs.get(k, d)
    def has(self, k): return k in self.attrs
    def find(self, *tags):
        out = []
        for c in self.children:
            if c.tag in tags: out.append(c)
            out.extend(c.find(*tags))
        return out
    def kids(self, *tags): return [c for c in self.children if c.tag in tags]
    def walk(self):
        for c in self.children:
            yield c
            yield from c.walk()
    def inner_text(self):
        s = "".join(self.text)
        for c in self.children: s += c.inner_text()
        return s.strip()


class Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("#root", {}, None)
        self.cur = self.root
    def handle_starttag(self, tag, attrs):
        n = Node(tag, {k: (v if v is not None else "") for k, v in attrs}, self.cur)
        self.cur.children.append(n)
        if tag not in VOID: self.cur = n
    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, {k: (v if v is not None else "") for k, v in attrs}, self.cur))
    def handle_endtag(self, tag):
        n = self.cur
        while n is not self.root and n.tag != tag: n = n.parent
        if n is not self.root: self.cur = n.parent
    def handle_data(self, data): self.cur.text.append(data)


def split(s):
    return [x for x in re.split(r"[\s,]+", (s or "").strip()) if x]


NEEDS_ANSWER = {"choose", "spot"}
OPTION_MODES = {"choose", "prediction", "estimate"}


def check(root):
    """Return (errors, warnings). Errors mean the lesson is broken for a learner."""
    err, warn = [], []

    # ── ids
    seen = {}
    for n in root.find(*[t for t in ALL_TAGS]) + root.find("div", "section", "span"):
        i = n.get("id")
        if i:
            if i in seen: err.append(f"duplicate id '{i}' (<{seen[i]}> and <{n.tag}>)")
            seen[i] = n.tag

    stages = root.find("l-stage")
    parts = {p.get("data-part") for st in stages for p in st.walk() if p.get("data-part")}
    parts |= {n.get("id") for st in stages for n in st.find("l-node") if n.get("id")}
    stage_ids = {s.get("id") for s in stages if s.get("id")}

    # ── control primitives point at something that exists
    for n in root.find("l-scene", "l-focus", "l-reveal", "l-step", "l-tstep"):
        for attr in ("focus", "reveal", "target"):
            for t in split(n.get(attr)):
                if parts and t not in parts:
                    err.append(f"<{n.tag} {attr}=\"{t}\"> — no [data-part=\"{t}\"] inside any <l-stage>")
        sid = n.get("stage")
        if sid and sid not in stage_ids:
            err.append(f"<{n.tag} stage=\"{sid}\"> — no <l-stage id=\"{sid}\">")

    if root.find("l-scene") and not stages:
        warn.append("<l-scene> elements but no <l-stage> — scenes have nothing to drive")

    # ── flow edges connect real nodes
    for f in root.find("l-flow"):
        nodes = {n.get("id") for n in f.kids("l-node")}
        for e in f.kids("l-edge"):
            for side in ("from", "to"):
                v = e.get(side)
                if v not in nodes:
                    err.append(f"<l-edge {side}=\"{v}\"> — no <l-node id=\"{v}\"> in this <l-flow>")
        for n in f.kids("l-node"):
            if not n.get("id"): err.append("<l-node> inside <l-flow> needs an id")

    # ── layers
    for l in root.find("l-layer"):
        names = set(split(l.get("layers")))
        if not names: err.append("<l-layer> needs a layers=\"a b c\" attribute")
        st = None
        sid = l.get("stage")
        for s in stages:
            if (sid and s.get("id") == sid) or (not sid and st is None): st = s
        if st:
            have = {x.get("data-layer") for x in st.walk() if x.get("data-layer")}
            for m in names - have:
                if have: err.append(f"<l-layer> declares '{m}' but no [data-layer=\"{m}\"] exists in the stage")

    # ── panels: the discipline is the whole mechanism
    for ps in root.find("l-panels"):
        panels = ps.kids("l-panel")
        if len(panels) < 3:
            warn.append(f"<l-panels> has {len(panels)} panel(s) — a sequence needs at least 3, "
                        "otherwise these are illustrated paragraphs")
    for pn in root.find("l-panel"):
        t = pn.get("title")
        where = f"<l-panel title=\"{t or '?'}\">"
        if not t:
            warn.append("<l-panel> has no title= — the title is the claim the drawing then shows")
        elif t.rstrip().endswith(("?",)) is False and " " not in t.strip():
            warn.append(f"{where} title is one word — a panel title is a sentence, not a topic")
        if not pn.find("l-draw") and not any("ml-huge" in (k.get("class") or "") for k in pn.children):
            warn.append(f"{where} has no <l-draw> and no .ml-huge figure — a panel with nothing "
                        "to look at is a paragraph")
        words = sum(len(k.inner_text().split()) for k in pn.kids("p"))
        if words > 40:
            warn.append(f"{where} caption is {words} words — panels hold ~25; the drawing is "
                        "supposed to be carrying this")

    # ── quizzes
    for q in root.find("l-quiz"):
        mode = q.get("mode", "choose")
        where = f"<l-quiz{' id=' + q.get('id') if q.get('id') else ''} mode=\"{mode}\">"
        if mode not in KIND: err.append(f"{where} unknown mode (valid: {', '.join(sorted(KIND))})")
        if not q.find("l-prompt"): err.append(f"{where} has no <l-prompt>")
        opts = q.find("l-option")

        if mode in NEEDS_ANSWER or (mode in OPTION_MODES and opts):
            ans = split(q.get("answer"))
            if not ans:
                err.append(f"{where} needs answer=\"…\"")
            elif opts:
                vals = {(o.get("value") or "ABCDEFGH"[i]).strip().lower() for i, o in enumerate(opts)}
                for a in ans:
                    if a.strip().lower() not in vals:
                        err.append(f"{where} answer=\"{a}\" matches no <l-option value>")
            if opts and len(opts) < 2: err.append(f"{where} needs at least 2 options")

        if mode == "spot":
            regions = {r.get("id") for r in q.find("l-region")}
            if not regions: err.append(f"{where} has no <l-region id> to click")
            for a in split(q.get("answer")):
                if a not in regions: err.append(f"{where} answer=\"{a}\" is not a region id")
        if mode == "classify":
            bs = q.find("l-bucket")
            if len(bs) < 2: err.append(f"{where} needs at least 2 <l-bucket name>")
            for b in bs:
                if not b.get("name"): err.append(f"{where} <l-bucket> needs name")
                if not b.find("l-item"): err.append(f"{where} bucket '{b.get('name')}' has no <l-item>")
        if mode == "arrange":
            n = len(q.find("l-item"))
            if n < 3: err.append(f"{where} needs at least 3 <l-item> (has {n})")
            if bool(q.get("low")) != bool(q.get("high")):
                warn.append(f"{where} has only one of low=/high= — a ranking needs both ends labelled")
        if mode == "estimate" and not opts:
            if not q.get("actual"): err.append(f"{where} slider form needs actual=\"…\"")
            if not (q.get("min") and q.get("max")): err.append(f"{where} slider form needs min= and max=")
        if mode == "explain":
            if not q.find("l-key") and not q.find("l-reference"):
                warn.append(f"{where} free-text with no <l-key> or <l-reference> — the learner gets no feedback")
        if mode == "prediction" and not (q.find("l-actual") or q.find("l-why")):
            warn.append(f"{where} without <l-actual> — a prediction with nothing to contrast against")
        if not q.find("l-why") and mode != "explain":
            warn.append(f"{where} has no <l-why> — being told 'wrong' without why teaches nothing")
        for m in q.find("l-miss"):
            if not m.get("for"): err.append(f"{where} <l-miss> needs for=\"<option value>\"")

    # ── what-if expressions reference declared variables
    for w in root.find("l-whatif"):
        # inline (reactive-document) form nests its vars inside the prose
        pick = w.find if w.has("inline") else w.kids
        names = {v.get("name") for v in pick("l-var")}
        if not names: err.append("<l-whatif> has no <l-var name>")
        for o in pick("l-out"):
            e = o.get("expr")
            if not e: err.append(f"<l-out name=\"{o.get('name')}\"> needs expr=\"…\"")
            else:
                # drop property accesses so Math.round does not read as a variable "round"
                bare = re.sub(r"\.\s*\w+", "", e)
                for word in set(re.findall(r"[A-Za-z_]\w*", bare)) - {"Math", "true", "false", "null"}:
                    if word not in names and not word.isupper():
                        err.append(f"<l-out expr=\"{e}\"> uses '{word}', which is not a <l-var name>")
        if not pick("l-out"): err.append("<l-whatif> has no <l-out> — nothing observable changes")

    # ── structural sanity
    for s in root.find("l-section"):
        if not s.get("goal"): warn.append(f"<l-section title=\"{s.get('title','?')}\"> has no goal=")
        if not s.get("id"): warn.append(f"<l-section title=\"{s.get('title','?')}\"> has no id — progress cannot track it")
    for st in root.find("l-stepper"):
        if len(st.kids("l-step")) < 2: err.append("<l-stepper> needs at least 2 <l-step>")
    for a in root.find("l-anatomy"):
        ps = a.kids("l-part")
        if len(ps) < 2: err.append("<l-anatomy> needs at least 2 <l-part>")
        for p in ps:
            if not p.find("l-note"): warn.append(f"<l-part> '{p.get('label','?')}' has no <l-note> — clicking it shows nothing")
    for c in root.find("l-compare"):
        if len(c.kids("l-column")) < 2: err.append("<l-compare> needs at least 2 <l-column>")
        for cr in c.kids("l-criterion"):
            if len(cr.find("l-cell")) != len(c.kids("l-column")):
                err.append(f"<l-criterion name=\"{cr.get('name')}\"> cell count does not match the columns")
    for b in root.find("l-branch"):
        if len(b.kids("l-path")) < 2: err.append("<l-branch> needs at least 2 <l-path>")
        for p in b.kids("l-path"):
            if not (p.get("label") or p.get("name")): err.append("<l-path> needs a label")

    if not root.find("l-checkpoint"): warn.append("no <l-checkpoint> anywhere — the lesson never consolidates")
    if not root.find("l-quiz"): warn.append("no <l-quiz> anywhere — this is a document, not a lesson")
    if not root.find("l-finish"): warn.append("no <l-finish> — the lesson stops instead of ending")
    for w in root.find("l-whatif"):
        if w.has("inline") and not w.find("l-var"):
            err.append("<l-whatif inline> has no <l-var> inside the prose")
        if w.has("inline"):
            for v in w.find("l-var"):
                if not v.get("value"): warn.append(f"inline <l-var name=\"{v.get('name')}\"> has no value= — it starts at min")

    return err, warn


KIND = {"prediction", "choose", "spot", "classify", "arrange", "explain", "estimate"}
ALL_TAGS = ["l-section","l-stack","l-split","l-stage","scroll-story","l-scene","l-stepper","l-step",
            "l-panels","l-panel","l-draw","l-focus","l-reveal","l-layer","l-anatomy","l-part","l-note","l-compare","l-column",
            "l-criterion","l-cell","l-transform","l-phase","l-flow","l-node","l-edge","l-trace",
            "l-tstep","l-state","l-field","l-whatif","l-var","l-out","l-sandbox","l-lab","l-run","l-quiz","l-prompt",
            "l-situation","l-option","l-region","l-bucket","l-item","l-pair","l-left","l-right",
            "l-blank","l-key","l-reference","l-actual","l-expected","l-why","l-miss","l-contrast",
            "l-checkpoint","l-can","l-branch","l-path","l-finish","l-next"]

PAGE = """<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="icon" href="{icon}">
<style>
{css}
</style>
</head>
<body>
{body}
<footer class="ml-sign">
  <img src="{icon}" alt="" width="22" height="22">
  <p>Created with <span role="img" aria-label="orange heart">\U0001f9e1</span> by
  <a href="https://webreactiva.com" rel="noopener">webreactiva.com</a></p>
</footer>
<script>
{js}
</script>
</body>
</html>
"""


def icon_uri():
    """Inline the mark as a data URI — a lesson has to work with no network."""
    svg = (ASSETS / "favicon.svg").read_text(encoding="utf-8")
    svg = re.sub(r"\s*\n\s*", " ", svg).strip()
    return "data:image/svg+xml," + quote(svg, safe="")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("body", help="HTML fragment with the lesson markup")
    ap.add_argument("-o", "--out", help="output file")
    ap.add_argument("--title", default="Lesson")
    ap.add_argument("--desc", default="")
    ap.add_argument("--lang", default="en")
    ap.add_argument("--check-only", action="store_true")
    ap.add_argument("--strict", action="store_true", help="treat warnings as errors")
    a = ap.parse_args()

    src = Path(a.body).read_text(encoding="utf-8")
    t = Tree(); t.feed(src)
    err, warn = check(t.root)

    for e in err: print(f"  ERROR  {e}", file=sys.stderr)
    for w in warn: print(f"  warn   {w}", file=sys.stderr)
    print(f"\n{len(err)} error(s), {len(warn)} warning(s)", file=sys.stderr)

    if err or (a.strict and warn):
        print("Fix these before shipping the lesson.", file=sys.stderr)
        if not a.check_only: sys.exit(1)
        sys.exit(1)
    if a.check_only:
        print("Lesson markup looks sound.", file=sys.stderr); return

    out = Path(a.out or Path(a.body).with_suffix(".lesson.html"))
    out.write_text(PAGE.format(
        lang=a.lang, title=html.escape(a.title), desc=html.escape(a.desc),
        icon=icon_uri(),
        css=(ASSETS / "runtime.css").read_text(encoding="utf-8"),
        js=(ASSETS / "runtime.js").read_text(encoding="utf-8"),
        body=src,
    ), encoding="utf-8")
    print(f"Wrote {out} ({out.stat().st_size // 1024} KB, self-contained)", file=sys.stderr)


if __name__ == "__main__":
    main()
