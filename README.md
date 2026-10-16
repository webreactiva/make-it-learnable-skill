<img src="assets/logo.svg" alt="" width="96" height="96">

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

Requirements: an agent that can write files, and a current browser to open the result.
The skill ships no code to install: no runtime, no build script, nothing to compile and
nothing to `npm install`.

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

The agent then reads the material, decides which components fit it, writes a
**blueprint** of the lesson, checks it, and builds a single `.html` file from it. An
explicitly requested language wins; otherwise the request language takes precedence
over the source language. The chrome text is specified in English and Spanish, and a
mixed-language page is never shipped.

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

One `.html` file, theme-aware, keyboard-accessible and printable.

A lesson is made of **sections**, each with a stated goal. A **stage** holds one
persistent representation — a diagram, a trace, a piece of state — and a **story**'s
scenes transform it as the reader scrolls, rather than swapping in a new picture each
time. **Checks** interrupt at the right moments, and a **finish** card closes the
lesson with what to revisit.

### How the skill works: blueprint + contracts

The skill contains **no markup, no stylesheet and no script**. It gives the agent two
things instead:

- **A blueprint format** ([`references/blueprint.md`](skills/make-it-learnable/references/blueprint.md))
  — a YAML plan of the lesson that names every component, in order, with every input
  filled in: prompts, answers, misses, whys, stage parts, effects, sources. It is
  where cross-references get checked, before any code exists.
- **Component contracts** ([`components.md`](skills/make-it-learnable/references/components.md),
  [`checks.md`](skills/make-it-learnable/references/checks.md),
  [`runtime.md`](skills/make-it-learnable/references/runtime.md)) — for each piece,
  what it is for, what it takes, how it behaves (numbers, thresholds, text, keyboard),
  and what must hold when it ships.

The agent writes the page its own way from those two. Two lessons can look nothing
alike inside and must behave identically outside.

### The vocabulary

The components, grouped by what they do. Two of them are narrative modes and you pick
one per stretch of the lesson: `Story` keeps one object on screen and transforms it
through scenes, `Panels` runs a sequence of full-width drawings with a sentence over
each. A good lesson uses **four to seven** of them: picking the right handful is the
main act of judgement, and using more is noise, not thoroughness.

| Family | Components |
|---|---|
| Structure | `Section` · `Stack` · `Split` · `Stage` · `Drawing` |
| Narrative | `Story` + `Scene` · `Panels` · `Stepper` · `Branch` |
| Attention | `Focus` · `Reveal` · `Layers` · `Anatomy` · `Compare` |
| Behaviour | `Transform` · `Flow` · `Trace` · `StateBox` |
| Experiment | `WhatIf` (panel or reactive-document) · `Sandbox` · `Lab` |
| Learning | `Check` · `Contrast` · `Checkpoint` — and `Finish` to end |

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
ending calls it out by name. Details: [`references/checks.md`](skills/make-it-learnable/references/checks.md).

## The reference implementation

[`reference-implementation/`](reference-implementation/) is the HTML runtime the
contracts were written from: custom elements, a stylesheet, a builder that validates
and assembles a lesson body, and two example bodies. It is **not part of the skill**
and is not distributed with it — it lives in this repo as the behavioural reference
and for authoring by hand:

```bash
python3 reference-implementation/scripts/build_lesson.py \
  reference-implementation/examples/cache-body.html -o lesson.html \
  --title "…" --desc "…" --lang en \
  --source "Source title|https://example.com/source"
```

Its markup contract is in [`reference-implementation/docs/`](reference-implementation/docs/).
`python3 -m unittest discover -s tests` runs the builder's tests.

## Examples

[`examples/gallery.html`](examples/gallery.html) — **not a lesson**, the whole
vocabulary in one page: every component, all 7 check mechanics, every variant, filled
with LLM content so the demos say something real. Open it directly and use it to look
things up. It was built with the reference implementation.

## Project layout

```
skills/make-it-learnable/      the packaged skill — the only thing distributed
  SKILL.md                     workflow + which components fit which material
  references/authoring.md      how to go from arbitrary source to a lesson
  references/blueprint.md      the blueprint format + a complete worked lesson
  references/components.md     one behaviour contract per component
  references/checks.md         the 7 check mechanics and the feedback shell
  references/runtime.md        page envelope, chrome, scoring, ending, palette
  references/visuals.md        when to draw instead of reaching for a widget
  assets/favicon.svg           the mark at 32, inlined into every lesson
reference-implementation/      the HTML runtime + builder the contracts describe
tests/                         tests for the reference builder
package-skill.sh               builds make-it-learnable.zip for distribution
make-it-learnable.zip          the artefact you hand to someone else (git-ignored)
examples/                      built lessons, open them in a browser
assets/                        the logo and the screenshots in this README
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
  A run is in-memory: a reload restarts the lesson, which is what a reload should
  mean. Only the **personal best** survives, in `localStorage`, so re-opening the file
  gives the reader a score to race rather than a blank slate.

## Testing the skill across models

The skill was tested by giving it, and nothing else from this repo, to other
models and opening what they built. Every run below is one lesson generated from
scratch. Topics: *seasons* (from a short source text, for high-school students
who think seasons come from the Earth–Sun distance), *DNS*, *the JavaScript
event loop*, *the HTTPS handshake* and *prompt caching*. Between rounds the skill
was fixed wherever a model went wrong, so a later round tests a later skill.

### opencode, in tmux

Token counts and cost come from opencode's own session database
(`~/.local/share/opencode/opencode.db`). The cost column is opencode's estimate at
list price; the runs actually went through an Ollama Cloud subscription (flat
fee). Time is wall-clock from the first prompt to the last message, including any
wait for a nudge.

| Round — what changed in the skill | Model | Topic | Input | Cache read | Output | Est. cost | Time | Outcome |
|---|---|---|---:|---:|---:|---:|---:|---|
| 1 — first spec, still prescribing the look | Kimi K3 | seasons | 163,589 | 3,526,768 | 80,924 | $2.76 | 16 min | best of the round, but looked like the reference |
| 1 | GLM 5.3 | seasons | 452,570 | 8,096,576 | 166,437 | $3.47 | 36 min | needed several nudges to stop planning |
| 1 | DeepSeek V4 Pro | seasons | 155,835 | 337,515 | 45,101 | $0.20 | 5 min | runtime `TypeError` at load |
| 1 | MiniMax M3 | seasons | 88,718 | 1,383,096 | 63,639 | $0.37 | 6 min | used `Function`/`eval` |
| 1 | Qwen 3.5 397B | seasons | 0 | 0 | 0 | — | — | did not start; dropped |
| 2 — design removed, colour as meaning | GLM 5.3 | seasons | 63,308 | 258,560 | 33,132 | $0.30 | 6 min | stuck planning; killed |
| 2 | DeepSeek V4 Pro | seasons | 110,882 | 1,642,700 | 47,569 | $0.20 | 5 min | own look; missing string key (`undefined` in HUD) |
| 2 | MiniMax M3 | seasons | 202,989 | 23,539,313 | 113,828 | $3.22 | 30 min | story stage scrolled away, Earth jumped |
| 3 — `Picture`, `Analogy`, `pose` | Muse Spark 1.3 (OpenCode Zen) | seasons | 0 | 0 | 0 | — | — | no account funds |
| 3 | Muse Spark Open | seasons | 97,707 | 698,048 | 30,115 | $0.36 | 4 min | pinned stage, but four Earths instead of one moving |
| 4 — layout skeletons | Muse Spark Open | seasons | 99,479 | 1,266,656 | 34,260 | $0.46 | 4 min | data in `<template>` broke every later check |
| 5 — same skill, prompt *asks* for big pictures | Muse Spark Open | DNS | 105,712 | 879,360 | 39,769 | $0.43 | 8 min | first real `pose`: the packet travels server to server |
| 6 — big pictures required by the skill, neutral prompt | Muse Spark Open | DNS | 92,913 | 481,344 | 27,162 | $0.30 | 3 min | visual with no prompt help; clean console |
| 6 | DeepSeek V4 Pro | event loop | 234,719 | 2,445,298 | 91,713 | $0.39 | 20 min | stopped before writing the HTML; one nudge |
| 6 | MiniMax M3 | HTTPS | 106,546 | 9,942,737 | 59,814 | $1.40 | 10 min | stage and scenes shorter than the screen |

Kimi K3 also has two aborted sessions of a few seconds (≈74k input, 1k output)
not shown. Reasoning tokens were reported as 0 by every provider here.

### Claude subagents

Run from Claude Code with the `Agent` tool, each told to read only the skill.
Tokens are summed from each subagent's transcript.

| When | Model | Topic | Input | Cache write | Cache read | Output | Calls | Time | Outcome |
|---|---|---|---:|---:|---:|---:|---:|---:|---|
| Before round 1 | Opus 5.5 | seasons | 34 | 136,683 | 1,687,250 | 37,701 | 16 | 8 min | first check that the skill stands on its own |
| Round 2 | Haiku 5.5 | seasons | 40 | 181,353 | 2,633,690 | 74,941 | 19 | 10 min | own look, clean console |
| Round 2 | Sonnet 5.5 | seasons | 34 | 161,382 | 1,564,496 | 45,159 | 17 | 9 min | wide story, but panels squeezed into 3 columns |
| Round 6 (final skill) | Sonnet 5.5 | seasons | 40 | 214,800 | 2,567,365 | 1,902¹ | 20 | 13 min | best result: one Earth travelling the orbit, all checks clean |
| Round 6 (final skill) | Sonnet 5.5 | prompt caching | 68 | 209,885 | 5,132,561 | 35,573 | 34 | 11 min | sources checked online; clean on desktop and phone |

¹ The transcript under-reports this run's output: it wrote an 80 KB page, which is
tens of thousands of output tokens.

**What the numbers say.** A lesson costs roughly 100–250k fresh input tokens and
30–110k output tokens whatever the model; what varies wildly is cache reads,
which grow with every extra turn a model spends re-reading its own context
(MiniMax's 23.5M in round 2 is a model going round in circles, not a bigger
lesson). The cheapest good runs were the ones that wrote the blueprint first and
the page in one go.

## Limits

- `Sandbox` is blocked by browsers on `file://`. Serve over HTTP
  (`python3 -m http.server`) to demo it, or leave it out of a file people open locally.
- Nothing leaves the browser. The personal best lives in `localStorage`, keyed by the
  lesson title — private to that reader, on that machine, and gone if they clear site
  data. There is no back end, and there is not going to be one.
- A lesson is only as honest as its source. The skill's hardest rule is *build from the
  source, not from memory* — a lesson asserts things confidently and gives the reader
  no way to check, so a plausible fabrication does more damage here than in prose.

---

Created with 🧡 by [webreactiva.com](https://webreactiva.com)
