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
from urllib.parse import quote, urlparse
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

    def closest(self, *tags):
        node = self.parent
        while node is not None:
            if node.tag in tags:
                return node
            node = node.parent
        return None


class Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("#root", {}, None)
        self.cur = self.root
        self.errors = []
    def handle_starttag(self, tag, attrs):
        n = Node(tag, {k: (v if v is not None else "") for k, v in attrs}, self.cur)
        self.cur.children.append(n)
        if tag not in VOID: self.cur = n
    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, {k: (v if v is not None else "") for k, v in attrs}, self.cur))
    def handle_endtag(self, tag):
        if self.cur is self.root:
            self.errors.append(f"closing </{tag}> has no matching opening tag")
            return
        if self.cur.tag != tag:
            self.errors.append(f"closing </{tag}> while <{self.cur.tag}> is still open")
        n = self.cur
        while n is not self.root and n.tag != tag: n = n.parent
        if n is not self.root:
            self.cur = n.parent
        else:
            self.errors.append(f"closing </{tag}> has no matching opening tag")
    def handle_data(self, data): self.cur.text.append(data)

    def finish(self):
        self.close()
        node = self.cur
        while node is not self.root:
            self.errors.append(f"unclosed <{node.tag}>")
            node = node.parent
        return self.root, self.errors


def split(s):
    return [x for x in re.split(r"[\s,]+", (s or "").strip()) if x]


NEEDS_ANSWER = {"choose", "spot"}
OPTION_MODES = {"choose", "prediction", "estimate"}
MATH_METHODS = {"abs", "ceil", "floor", "max", "min", "pow", "round", "sqrt"}
FORBIDDEN_BODY_TAGS = {"base", "embed", "foreignobject", "iframe", "link", "meta", "object", "script", "style"}
URI_ATTRS = {"href", "src", "xlink:href", "formaction"}


def parse(src):
    tree = Tree()
    tree.feed(src)
    return tree.finish()


def first_descendant(node, tag):
    found = node.find(tag)
    return found[0] if found else None


def stage_for(node, stages, stage_by_id):
    """Mirror runtime.js stageFor so validation cannot approve the wrong stage."""
    stage_id = node.get("stage")
    if not stage_id:
        controller = node.closest("l-scene", "l-stepper", "l-trace")
        if controller:
            stage_id = controller.get("stage")
    if stage_id:
        return stage_by_id.get(stage_id)
    scope = node.closest("l-section", "scroll-story", "body")
    scoped = first_descendant(scope, "l-stage") if scope else None
    return scoped or (stages[0] if stages else None)


def stage_parts(stage):
    if stage is None:
        return set()
    parts = {p.get("data-part") for p in stage.walk() if p.get("data-part")}
    parts |= {n.get("id") for n in stage.find("l-node") if n.get("id")}
    return parts


def expression_error(expr, names):
    """Keep reactive expressions arithmetic-only; they execute in the page."""
    if len(expr or "") > 500:
        return "is longer than the 500-character expression limit"
    if not re.fullmatch(r"[\w\s.+\-*/%(),<>=!&|?:]+", expr or ""):
        return "contains characters outside the safe arithmetic expression grammar"
    properties = re.findall(r"\.\s*([A-Za-z_]\w*)", expr)
    if any(prop not in MATH_METHODS for prop in properties):
        return "uses a property other than the allowed Math helpers"
    bare = re.sub(r"\.\s*\w+", "", expr)
    allowed = set(names) | {"Math", "true", "false", "null"}
    unknown = sorted(set(re.findall(r"[A-Za-z_]\w*", bare)) - allowed)
    if unknown:
        return f"uses undeclared name(s): {', '.join(unknown)}"
    if "Math" in bare and not re.search(r"\bMath\s*\.", expr):
        return "uses Math without an allowed helper"
    return None


def check(root, parse_errors=None):
    """Return (errors, warnings). Errors mean the lesson is broken for a learner."""
    err, warn = list(parse_errors or []), []

    # The runtime must use inline JS, so CSP cannot distinguish it from an
    # author-supplied script. Reject executable or externally loaded body markup.
    for node in root.walk():
        if node.tag in FORBIDDEN_BODY_TAGS:
            err.append(f"<{node.tag}> is not allowed in a lesson body")
        for attr, value in node.attrs.items():
            if attr.lower().startswith("on"):
                err.append(f"<{node.tag} {attr}=\"…\"> inline event handlers are not allowed")
            if attr.lower() in URI_ATTRS and value:
                parsed = urlparse(value)
                safe_link = node.tag == "a" and (value.startswith("#") or (parsed.scheme in {"http", "https"} and parsed.netloc))
                safe_image = node.tag == "img" and value.startswith("data:image/")
                if not (safe_link or safe_image):
                    err.append(f"<{node.tag} {attr}=\"{value}\"> is not a safe self-contained URL")

    # ── ids
    seen = {}
    for n in root.find(*[t for t in ALL_TAGS]) + root.find("div", "section", "span"):
        i = n.get("id")
        if i:
            if i in seen: err.append(f"duplicate id '{i}' (<{seen[i]}> and <{n.tag}>)")
            seen[i] = n.tag

    stages = root.find("l-stage")
    stage_by_id = {s.get("id"): s for s in stages if s.get("id")}

    for stage in stages:
        seen_parts = set()
        for part in [p.get("data-part") for p in stage.walk() if p.get("data-part")]:
            if part in seen_parts:
                err.append(f"<l-stage id=\"{stage.get('id', '?')}\"> has duplicate data-part=\"{part}\"")
            seen_parts.add(part)

    # ── control primitives point at something that exists
    for n in root.find("l-scene", "l-focus", "l-reveal", "l-step", "l-tstep"):
        stage = stage_for(n, stages, stage_by_id)
        parts = stage_parts(stage)
        for attr in ("focus", "reveal", "target"):
            for t in split(n.get(attr)):
                if stage is None:
                    err.append(f"<{n.tag} {attr}=\"{t}\"> — no <l-stage> can receive this effect")
                elif t not in parts:
                    err.append(f"<{n.tag} {attr}=\"{t}\"> — target does not exist in resolved <l-stage id=\"{stage.get('id', '?')}\">")
        sid = n.get("stage")
        if sid and sid not in stage_by_id:
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
        st = stage_for(l, stages, stage_by_id)
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
        if mode == "prediction" and not q.find("l-actual"):
            err.append(f"{where} needs <l-actual> — prediction must contrast expectation with reality")
        if not q.find("l-why") and not (mode == "explain" and q.find("l-reference")):
            err.append(f"{where} has no explanatory feedback (<l-why>, or <l-reference> for explain)")
        answers = {a.lower() for a in split(q.get("answer"))}
        option_values = [(o.get("value") or "ABCDEFGH"[i]).strip().lower() for i, o in enumerate(opts)]
        miss_values = {m.get("for", "").strip().lower() for m in q.find("l-miss")}
        for value in option_values:
            if value not in answers and value not in miss_values:
                err.append(f"{where} wrong option '{value}' needs <l-miss for=\"{value}\">")
        for m in q.find("l-miss"):
            if not m.get("for"): err.append(f"{where} <l-miss> needs for=\"<option value>\"")
            elif m.get("for").strip().lower() not in option_values:
                err.append(f"{where} <l-miss for=\"{m.get('for')}\"> matches no option")

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
                issue = expression_error(e, names)
                if issue:
                    err.append(f"<l-out expr=\"{e}\"> {issue}")
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
    for finish in root.find("l-finish"):
        if not finish.find("l-next"):
            err.append("<l-finish> needs <l-next> — the lesson must state its honest scope and next step")
    shells = [n for n in root.find("div") if "ml-shell" in split(n.get("class"))]
    if len(shells) != 1:
        err.append(f"lesson body needs exactly one <div class=\"ml-shell\"> (found {len(shells)})")
    elif not shells[0].find("header"):
        err.append(".ml-shell needs a <header class=\"ml-hero\">")
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
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none'; worker-src blob:; frame-src 'self'; base-uri 'none'; form-action 'none'">
<link rel="icon" href="{icon}">
<style>
{css}
</style>
</head>
<body>
{body}
<aside class="ml-sources" aria-label="{sources_title}">
  <h2>{sources_title}</h2>
  <ul>{sources}</ul>
</aside>
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
    ap.add_argument("--source", action="append", default=[], metavar="LABEL|URL",
                    help="source provenance; repeat for multiple sources")
    ap.add_argument("--check-only", action="store_true")
    ap.add_argument("--strict", action="store_true", help="deprecated: strict validation is now the default")
    ap.add_argument("--lenient", action="store_true", help="allow advisory warnings while drafting")
    a = ap.parse_args()

    src = Path(a.body).read_text(encoding="utf-8")
    root, parse_errors = parse(src)
    err, warn = check(root, parse_errors)

    if not a.check_only and not a.source:
        err.append("at least one --source is required (use a plain label for general knowledge)")
    if not a.check_only and (a.title == "Lesson" or not a.desc.strip()):
        err.append("shipping a lesson requires explicit --title and --desc metadata")
    if a.lang.lower().split("-")[0] not in {"en", "es"}:
        err.append(f"--lang {a.lang!r} has no complete STRINGS block in assets/runtime.js")

    source_items = []
    for raw in a.source:
        label, sep, url = raw.partition("|")
        label = html.escape(label.strip())
        if not label:
            err.append("--source needs a non-empty label")
            continue
        if sep and url.strip():
            parsed = urlparse(url.strip())
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                err.append(f"--source URL must be absolute http(s): {url.strip()!r}")
                continue
            safe_url = html.escape(url.strip(), quote=True)
            source_items.append(f'<li><a href="{safe_url}" rel="noopener noreferrer">{label}</a></li>')
        else:
            source_items.append(f"<li>{label}</li>")

    for e in err: print(f"  ERROR  {e}", file=sys.stderr)
    for w in warn: print(f"  warn   {w}", file=sys.stderr)
    print(f"\n{len(err)} error(s), {len(warn)} warning(s)", file=sys.stderr)

    if err or (warn and not a.lenient):
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
        sources_title="Fuentes" if a.lang.lower().startswith("es") else "Sources",
        sources="".join(source_items),
    ), encoding="utf-8")
    print(f"Wrote {out} ({out.stat().st_size // 1024} KB, self-contained)", file=sys.stderr)


if __name__ == "__main__":
    main()
