<img src="skills/make-it-learnable/assets/logo.svg" alt="" width="96" height="96">

# make-it-learnable

*[Léelo en español](README.es.md)*

**Turn any source material into a self-contained interactive lesson.** Point it at a
document, a repo, a function, a paper, a URL or a rough explanation, and it produces
one HTML file: a scroll-driven narrative over a diagram that transforms, checks that
make the reader commit to an answer before the reveal, and an ending that tells them
what to go back over.

No build step, no dependencies, no network. Open the file, mail it, put it on a USB
stick. It still works in five years.

The format is an [explorable explanation](https://en.wikipedia.org/wiki/Explorable_explanation)
— an interactive model of a concept carried by prose, where the reader states an
expectation and then watches reality disagree. It is not a slide deck with a quiz
bolted on the end.

---

## Install

**Try it in one project first.** Attach `make-it-learnable.zip` and ask your agent, in
plain language:

```
Install this skill in this project so I can use it @make-it-learnable.zip
```

It unpacks the skill into the project — `.claude/skills/` for Claude Code,
`.agents/skills/` for other agents — and it is there from the next prompt on.

**Or do it yourself**, from the project root:

```bash
unzip make-it-learnable.zip -d .claude/skills/   # Claude Code
unzip make-it-learnable.zip -d .agents/skills/   # other agents
```

Once a couple of lessons have convinced you, install it for every project: copy that
same `make-it-learnable/` folder into `~/.claude/skills/` (or `~/.agents/skills/`).
From a clone of this repo the folder to copy is `skills/make-it-learnable/`.

Requirements: **Python 3** (standard library only) and a browser with CSS `:has()` —
Chrome 105+, Safari 15.4+, Firefox 121+. The runtime is custom elements and plain CSS;
there is nothing to compile and nothing to `npm install`.

## Use it

Type `/make-it-learnable` — no space in the name — and after it, whatever you want
turned into a lesson:

```
/make-it-learnable https://en.wikipedia.org/wiki/Explorable_explanation
/make-it-learnable docs/architecture.md
/make-it-learnable src/scheduler.ts — for a new backend hire
/make-it-learnable this whole repo, for someone joining the team on Monday
/make-it-learnable por qué el consenso Raft necesita un líder
```

Anything goes in that slot: **a URL** (a Wikipedia article, a blog post, an RFC), **a
file**, **a folder or the whole codebase**, **a paper or a transcript**, or just **a
topic** described in words. Add who it is for and it will pitch the lesson at them.
With no argument at all it asks — it has no default subject, and guessing one wastes a
whole build.

The agent then reads the material, decides which primitives fit it, writes the lesson
body, and builds it into a single `.html` file. Content comes out in the language of
your source; the runtime's own chrome (buttons, verdicts, the ending card) stays in
English.

## What it looks like

A stage that stays put while the prose moves — the diagram transforms instead of being
replaced:

![A scroll-driven scene: the Prompt → Tokenizador → Modelo → Logits pipeline on the left with the Logits node highlighted, and the narration beside it](assets/scroll-story.png)

The reader can also drive the same stage by hand, step by step, and watch the state
change underneath:

![A stepper on step 2 of 3 driving a stage, with a runtime state table showing input tokens, generated tokens and KV cache positions](assets/stepper-stage.png)

Checks that make the reader commit *before* the reveal, confidence included — so
"confident and wrong" becomes visible instead of invisible:

![A prediction check after answering: the chosen option in red, the correct one in green, a confidence slider, a You expected / What actually happens comparison, and a +25 you committed to an answer badge](assets/check.png)

That is one of seven mechanics. Ordering a process, spotting a concept in real code and
estimating a magnitude are different questions, and they fail differently.

## What it builds

One `.html` file, roughly 110 KB, theme-aware, keyboard-accessible and printable.

A lesson is made of **sections**, each with a stated goal, wrapped in a
**scroll-story** that turns scroll position into narrative time. A **stage** holds one
persistent representation — a diagram, a trace, a piece of state — and scenes
transform it as the reader moves, rather than swapping in a new picture each time.
**Checks** interrupt at the right moments, and a **finish** card closes the lesson
with what to revisit.

### The vocabulary

Twenty primitives, grouped by what they do — plus the `scroll-story` runtime they
live inside (with its `l-scene` beats) and the `l-finish` card that closes a lesson.
A good lesson uses **four to seven** of them: picking the right handful is the main
act of judgement, and using more is noise, not thoroughness.

| Family | Primitives |
|---|---|
| Structure | `l-section` · `l-stack` · `l-split` · `l-stage` |
| Narrative | `l-stepper` · `l-branch` — inside the `scroll-story` runtime and its `l-scene` beats |
| Attention | `l-focus` · `l-reveal` · `l-layer` · `l-anatomy` · `l-compare` |
| Behaviour | `l-transform` · `l-flow` · `l-trace` · `l-state` |
| Experiment | `l-whatif` (panel or reactive-document) · `l-sandbox` |
| Learning | `l-quiz` · `l-contrast` · `l-checkpoint` — and `l-finish` to end |

Full markup contract: [`references/primitives.md`](skills/make-it-learnable/references/primitives.md).

### The checks

Seven mechanics. Only the reader's *action* changes; the shell around it —
situation → action → evaluation → feedback — stays the same.

| Mechanic | What it tells you |
|---|---|
| `prediction` | Does their mental model produce the right output? |
| `spot` | Can they recognise the concept in real material? |
| `classify` | Can they tell two confusable things apart? |
| `arrange` | Do they understand the process? (add `low`/`high` for a ranking) |
| `explain` | Can they *generate* the explanation, not just recognise it? |
| `estimate` | Is their sense of scale right? |
| `choose` | Is it genuinely a choice between named options? |

Add `confidence` and the reader rates how sure they were. The valuable case is
**confident and wrong** — a belief they actively trust that does not hold — and the
ending calls it out by name. Details: [`references/quiz-modes.md`](skills/make-it-learnable/references/quiz-modes.md).

## Authoring by hand

You do not need the agent. Write a body fragment and build it:

```html
<div class="ml-shell">
  <header class="ml-hero">
    <p class="ml-eyebrow">Backend fundamentals · 12 min</p>
    <h1>Why a cache sits in front of your database</h1>
  </header>

  <scroll-story>
    <l-section id="predict" title="Before we fix it" goal="Commit to a number first">
      <l-quiz mode="prediction" answer="b" confidence>
        <l-prompt>The same page is requested 1,000 times. How many DB queries?</l-prompt>
        <l-option value="a">Once — databases cache repeated queries</l-option>
        <l-option value="b">1,000 times</l-option>
        <l-actual>1,000 times.</l-actual>
        <l-miss for="a">Databases do keep pages in memory, so the query gets faster.
        But "faster query" is not "no query".</l-miss>
        <l-why><p>The database has no idea the answer is about to be asked for
        again. That is the gap a cache fills — not speed, <b>repetition</b>.</p></l-why>
      </l-quiz>
    </l-section>
  </scroll-story>

  <l-finish title="That's caching, honestly"></l-finish>
</div>
```

```bash
python3 skills/make-it-learnable/scripts/build_lesson.py lesson-body.html -o lesson.html \
  --title "…" --desc "…" --lang en
```

The build script refuses to ship broken cross-references — a `focus` target that does
not exist, a quiz with no answer, a `l-out` using an undeclared variable — because
those fail *silently* in a browser: the page still renders, it just stops teaching.
Warnings (a check with no `<l-why>`, a section with no goal) are advice worth taking.

Check without building:

```bash
python3 skills/make-it-learnable/scripts/build_lesson.py lesson-body.html --check-only
```

## Examples

[`examples/gallery.html`](examples/gallery.html) — **not a lesson**, the whole
vocabulary in one page: all 20 primitives, all 7 check mechanics, every variant,
filled with LLM content so the demos say something real. Open it directly and use it
to look things up. Its readable source is
[`skills/make-it-learnable/examples/gallery-body.html`](skills/make-it-learnable/examples/gallery-body.html);
the other `*-body.html` files next to it are full lessons the authoring agent reads
as models.

## Project layout

```
skills/make-it-learnable/      the packaged skill — the only thing distributed
  SKILL.md                     workflow + which primitives fit which material
  references/authoring.md      how to go from arbitrary source to a lesson
  references/primitives.md     markup contract for all 20 primitives
  references/quiz-modes.md     the 7 check mechanics
  assets/runtime.{css,js}      the runtime — never edited when authoring a lesson
  assets/logo.svg              the mark
  assets/favicon.svg           the mark at 32, inlined into every build
  scripts/build_lesson.py      assembles and validates
  examples/*-body.html         readable sources the authoring agent reads
package-skill.sh               builds make-it-learnable.zip for distribution
make-it-learnable.zip          the artefact you hand to someone else (git-ignored)
examples/                      built lessons, open them in a browser
assets/                        the screenshots in this README
```

## Design notes

- **Palette: Fiery Ocean**, assigned by role rather than by looks. It ships two reds,
  and a lesson cannot afford for *highlighted* and *wrong* to be the same colour — so
  deep crimson is identity, ocean blue is interaction, bright red means incorrect and
  nothing else, and green means correct. Every text pair is contrast-checked.
- **No webfonts.** A system stack that lands on a real face per platform (Avenir Next,
  Segoe UI Variable, Ubuntu, Roboto) and never bottoms out on Arial. A Google Fonts
  link would break the one promise the format makes.
- **Points are a mirror, not the point.** The scoring pays for committing to an answer
  before the reveal, being honest about confidence, and touching the model — never for
  clicking around. Explorable explanations are normally defined *against* gamification;
  this keeps a light layer only because it makes the confident-and-wrong case visible.
  Score is in-memory: a reload restarts the lesson, which is what a reload should mean.

## Limits

- `l-sandbox` is blocked by browsers on `file://`. Serve over HTTP
  (`python3 -m http.server`) to demo it, or leave it out of a file people open locally.
- The score does not persist. There is no back end, and there is not going to be one.
- A lesson is only as honest as its source. The skill's hardest rule is *build from the
  source, not from memory* — a lesson asserts things confidently and gives the reader
  no way to check, so a plausible fabrication does more damage here than in prose.

---

Created with 🧡 by [webreactiva.com](https://webreactiva.com)
