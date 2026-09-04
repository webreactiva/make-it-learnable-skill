# The vocabulary

A vocabulary plus a runtime. Each primitive does a single thing, and complex
teaching objects are built by combining them rather than by reaching for a
bigger component. A `CodeWalkthrough` is not a primitive — it is
`Split + Stepper + Focus + Trace + State`.

Everything below is light-DOM custom elements. Content lives in the markup;
the runtime only adds behaviour. Nothing needs a build step.

## Contents

- [Structure](#structure) — `l-section`, `l-stack`, `l-split`, `l-stage`, `l-draw`
- [Narrative](#narrative) — `scroll-story`, `l-scene`, `l-panels`, `l-stepper`, `l-branch`
- [Attention](#attention) — `l-focus`, `l-reveal`, `l-layer`, `l-anatomy`, `l-compare`
- [Behaviour](#behaviour) — `l-transform`, `l-flow`, `l-trace`, `l-state`
- [Experiment](#experiment) — `l-whatif` (panel and reactive-document forms), `l-sandbox`, `l-lab`
- [Learning](#learning) — `l-quiz`, `l-contrast`, `l-checkpoint`, `l-finish`
- [The effect protocol](#the-effect-protocol) — how the control primitives talk to a stage

---

## Structure

### `l-section` — the unit of intent

One section, one idea you are trying to install. Not a screen, not a scroll
length: a section can be a paragraph or five viewports.

```html
<l-section id="cache-miss" title="The path nobody draws"
           goal="Follow a cache miss step by step" eyebrow="Optional kicker">
  …
</l-section>
```

`id` is required for progress and for the ending's revisit links. `goal` is
required in practice: if you cannot write the goal in one sentence, the section
is doing two things and should be two sections.

### `l-stack` — vertical rhythm

Deliberately boring. Composition, not pedagogy.

```html
<l-stack density="tight|loose">…</l-stack>
```

### `l-split` — two things visible at once

Use it when the reader would otherwise have to remember something that just
scrolled away.

```html
<l-split ratio="1:1|1:2|2:1" sticky>
  <div>the prose</div>
  <l-stage>the thing it is about</l-stage>
</l-split>
```

`sticky` pins the second child.

### `l-stage` — the persistent representation

The single most important structural choice in the format. Rather than showing
diagram 1, diagram 2, diagram 3, you keep one object on screen and transform it.
That is what lets a reader build causal intuition instead of a slideshow memory.

```html
<l-stage id="arch" label="One product page request" sticky>
  <l-flow>…</l-flow>
</l-stage>
```

Anything inside a stage that other primitives should be able to point at needs
`data-part="name"`. Parts that should not exist yet get `data-reveal="later"`.

```html
<div data-part="redis" data-reveal="later">Redis</div>
```

### `l-draw` — a drawing you author, driven by the story

The other visual primitives are furniture: `l-flow` gives you boxes on a grid,
`l-anatomy` gives you labelled parts. They are right when the shape of the idea
*is* boxes and arrows, and they are wrong the rest of the time — which is more
often than the vocabulary makes it look. `l-draw` holds inline SVG you wrote for
this one subject, and puts it under the same effect protocol as everything else.

```html
<l-stage id="pipe" label="How a request gets a body" sticky>
  <l-draw>
    <svg viewBox="0 0 640 260" role="img" aria-label="A request travelling through the proxy">
      <path class="ml-stroke ml-muted" d="M40 130 H600"/>
      <g data-part="proxy">
        <rect class="ml-fill ml-accent" fill-opacity=".14" x="250" y="80" width="140" height="100" rx="10"/>
        <text class="ml-label" x="320" y="135" text-anchor="middle">proxy</text>
      </g>
      <circle data-part="packet" data-reveal="later" class="ml-fill ml-accent" cx="120" cy="130" r="14"/>
      <g data-part="buffer" data-when="buffered">…</g>
    </svg>
  </l-draw>
</l-stage>
```

Any element inside the drawing can carry `data-part`, `data-reveal="later"`,
`data-when` or `data-layer` — a `<g>`, a `<path>`, a single `<text>` — and every
`focus=`, `reveal=`, `state=` and `layers=` on a scene, step or trace works on it
unchanged. That is the whole point: eleven diagrams in a slideshow teach a
slideshow; one drawing that changes teaches a mechanism.

**Focus reads as everything else fading.** The runtime dims unfocused parts; it
does not draw a ring around SVG. If a part needs to look emphatic, draw it
emphatic — that is your job, not the stylesheet's.

**Helpers, all opt-in.** `l-draw` sets nothing on your elements unless you ask
for it, so a plain `fill="#c1121f"` is yours to keep. When you do want the
lesson's palette — and you usually do, because it is the only way the drawing
survives dark mode and printing — the classes carry it: `ml-fill` and `ml-stroke`
paint from `currentColor`, `ml-label` sets text, and `ml-accent`, `ml-accent-2`,
`ml-muted`, `ml-ok` and `ml-bad` set the `color` that both inherit from. A label
sitting *on* a filled shape needs `ml-on-accent`, which is the one colour that
stays readable against a fill in both themes. Tint with `fill-opacity`, not with
a second colour.

Give the `<svg>` a `viewBox` and no `width`/`height` — it fills the stage and
scales. Give it `role="img"` and an `aria-label` saying what it shows.

`references/visuals.md` is how to decide *what* to draw. Read it before drawing;
a technically correct SVG of the wrong thing is still the wrong thing.

---

## Narrative

### `scroll-story` — the narrative runtime

Wraps the sections and turns scroll position into narrative time. Publishes
progress, active section, direction and visit history, and drives the stage.

```html
<scroll-story>
  <l-section id="…">…</l-section>
</scroll-story>
```

### `l-scene` — a beat within the story

A scene declares what the stage should look like while the reader is reading it.
Reveals accumulate: a scene inherits everything earlier scenes revealed, so
scrolling backwards or deep-linking never shows a half-built diagram.

```html
<l-scene name="db" stage="arch" focus="db" reveal="redis" state="miss" step="2">
  <p>Then it asks the database…</p>
</l-scene>
```

Each scene reserves `72vh` so the reader has room to read before the stage
moves. Seven one-sentence scenes is therefore five viewports of scrolling for
seven sentences — if the beats are that short, either they belong in one scene
or the stretch wants `l-panels`. Set `--scene-height` on the `scroll-story` to
override (`style="--scene-height:56vh"`).

**One beat per scene, and keep it short.** A scene is a single moment of the
narration, not a container for a topic — three or four facts in one scene means
the reader is still reading while the stage has already moved on. Split it.

The idiomatic layout is prose scrolling past a pinned stage:

```html
<div class="ml-story-grid">
  <div class="ml-story-stage"><l-stage id="arch" sticky>…</l-stage></div>
  <div>
    <l-scene stage="arch" focus="browser">…</l-scene>
    <l-scene stage="arch" focus="api">…</l-scene>
  </div>
</div>
```

### `l-panels` — a sequence of beats, each with its own drawing

The other narrative mode, and the inverse of a scroll story. There is no sticky
stage, no scene, no scroll machinery and no JS: each beat is a full-width
drawing with a sentence over it, and the reader just reads down the page.

```html
<l-panels numbered>
  <l-panel title="El modelo no sabe qué palabra viene.">
    <p>Ha leído el prompt entero. Lo que tiene delante es un hueco.</p>
    <l-draw><svg viewBox="0 0 640 120" role="img" aria-label="…">…</svg></l-draw>
  </l-panel>
  <l-panel title="Pero sabe cuánto apuesta por cada una.">…</l-panel>
  <l-panel title="Y entonces tira un dado cargado.">…</l-panel>
</l-panels>
```

`numbered` puts a counter on each beat — right for anything the reader will
count off ("eight things happen"), noise for an argument. A beat whose payload
is a single figure uses `<p class="ml-huge">200 ms<small>por lectura</small></p>`
instead of a drawing; the number *is* the drawing.

**The proportions are the mechanism, and they are already in the CSS.** The
drawing is 780px wide against a 38ch prose column — about twice as wide — and
takes roughly two thirds of the vertical space. Do not fight that with a wall of
text: the caption is around 25 words, the title carries the claim, and the
drawing carries the argument. The builder warns past 40 words.

**Which mode for which job.** These two are not stylistic alternatives:

| | reach for |
|---|---|
| one object the reader must watch change — a system gaining a component, a buffer filling, state moving through a machine | `scroll-story` + `l-stage` |
| several distinct questions, each answered by its own picture | `l-panels` |

Getting this backwards has a specific cost. A sequence of independent drawings
of *the same system* lets the topology drift between beats — draw a cache beside
the database in one panel and in the middle in the next, and you have taught
read-through while meaning cache-aside. If the beats are redraws of one thing,
they are scenes, and they belong on a stage.

Panels can appear more than once in a lesson, and a lesson can use both modes:
panels to build the picture, a stage later for the part that has to move.

### `l-stepper` — discrete, reversible progression

Use instead of scroll when the reader needs to go back, repeat, or compare two
steps directly. Scroll is bad at all three.

```html
<l-stepper stage="arch" start="0">
  <l-step focus="api" state="parse">…</l-step>
  <l-step focus="db"  state="query">…</l-step>
</l-stepper>
```

### `l-branch` — the explanation forks

For when two readers genuinely need different routes, based on what they already
know or what they are trying to do.

```html
<l-branch question="Which of these is your problem right now?"
          rejoin="Either way, the checkpoint below is the same.">
  <l-path name="stale" label="My data goes stale">…</l-path>
  <l-path name="hitrate" label="My hit rate is bad">…</l-path>
</l-branch>
```

---

## Attention

### `l-focus` — say where to look

Highlights a part and visually subordinates everything else. Usually declared on
a scene or step; standalone it triggers on scroll.

```html
<l-focus target="authMiddleware" stage="arch">Here the request can still be rejected.</l-focus>
```

### `l-reveal` — introduce information when it earns its place

Two forms. Inside a scene, `<l-reveal target="redis">` uncovers a stage part.
Standalone, it hides its own content behind a button.

```html
<l-reveal label="Show what actually happens">
  <p>…</p>
</l-reveal>
```

### `l-layer` — one drawing, several questions

Turn dimensions of a representation on and off, so a complex system answers one
question at a time.

```html
<l-layer stage="arch" layers="components dataflow errors" default="components"
         label-dataflow="data flow"></l-layer>
```

Elements in the stage opt in with `data-layer="dataflow"`.

### `l-anatomy` — what parts does it have

Decomposes one entity into inspectable parts. Works on code, prompts, URLs,
HTTP responses, JSON, architectures, documents.

```html
<l-anatomy hint="Pick a part to inspect it.">
  <l-part label="System"><l-note><p>Sets the frame…</p></l-note></l-part>
  <l-part label="Examples"><l-note><p>Does the real work…</p></l-note></l-part>
</l-anatomy>
```

### `l-compare` — alternatives on shared dimensions

```html
<l-compare label="">
  <l-column>REST</l-column>
  <l-column>GraphQL</l-column>
  <l-criterion name="Shape of a request">
    <l-cell>Several endpoints</l-cell>
    <l-cell>One query</l-cell>
  </l-criterion>
</l-compare>
```

Every criterion needs exactly one cell per column. Clicking a criterion isolates
that row, which is how you build a comparison gradually instead of dumping a table.

---

## Behaviour

### `l-transform` — A becomes B

More general than before/after. Good for pipelines: `source → AST`,
`prompt → tokens`, `spec → code`.

```html
<l-transform>
  <l-phase name="Spec">what we want</l-phase>
  <l-phase name="Plan">how we get it</l-phase>
  <l-phase name="Code">the thing</l-phase>
</l-transform>
```

### `l-flow` — movement between entities

Nodes are laid out on a CSS grid; edges are drawn as SVG between the real boxes,
so wording changes never break the arrows. Node ids double as `data-part` names.

```html
<l-flow cols="3">
  <l-node id="browser" data-part="browser">Browser<small>the reader</small></l-node>
  <l-node id="api"     data-part="api">API</l-node>
  <l-node id="db"      data-part="db" row="2" col="2">Database</l-node>
  <l-edge from="browser" to="api" label="GET /product/42"></l-edge>
  <l-edge from="api" to="db" label="SELECT …"></l-edge>
</l-flow>
```

Edges into a node that has not been revealed yet stay hidden automatically.

### `l-trace` — one concrete execution

`l-flow` explains the system in the abstract; `l-trace` answers "what happened in
*this* run". Give the reader the concrete instance first — an abstraction they
have no instance for is not an abstraction, it is a definition.

```html
<l-trace stage="arch">
  <l-tstep detail="GET /product/42 arrives.">request received</l-tstep>
  <l-tstep detail="GET product:42 → (nil)." focus="redis">ask Redis</l-tstep>
</l-trace>
```

### `l-state` — make the invisible visible

Most hard concepts are hard because their state is invisible: caches, event
loops, state machines, agents, protocols.

```html
<l-state name="request timing">
  <l-field key="cache lookup" value="1 ms"></l-field>
  <l-field key="db query" value="90 ms"></l-field>
</l-state>
```

Values updated through the effect protocol flash on change.

---

## Experiment

### `l-whatif` — a small causal laboratory

Two forms, and the choice between them matters.

**Reactive-document form** (Bret Victor's *Tangle*): the numbers live inside the
sentence and the reader scrubs them in place. Use this when the relationship
*is* the sentence — it keeps reading and manipulating in the same act.

```html
<l-whatif inline>
  <p>At a hit rate of
     <l-var name="hit" min="0" max="100" value="80" unit="%" label="hit rate"></l-var>
     the average read costs
     <l-out name="avg" expr="hit/100*2 + (1-hit/100)*90" unit="ms"></l-out>.</p>
  <p class="ml-scrub-hint">Drag any orange number, or focus it and use the arrow keys.</p>
</l-whatif>
```

**Panel form**: several controls, several readouts, for when the reader should
hunt for a threshold rather than follow a sentence.

```html
<l-whatif>
  <l-var name="hit" type="range" min="0" max="100" value="85" step="5" unit="%" label="Hit rate"></l-var>
  <l-var name="cache" type="toggle" value label="Cache enabled"></l-var>
  <l-out name="avg" label="Average read" expr="hit/100*2 + (1-hit/100)*93"
         unit=" ms" good="low" threshold="30"></l-out>
</l-whatif>
```

`expr` is JavaScript over the declared variable names, evaluated on every change.
`good="low|high"` with `threshold` colours the readout.

**The model must be honest.** An explorable explanation only works if the
simulation follows a consistent model — a reader who discovers a relationship
that is not real has been taught something false, more convincingly than prose
could have. Simplify the model all you like; do not fake it. If you cannot
defend the formula, use `l-compare` instead.

### `l-sandbox` — open-ended experimentation

Where `WhatIf` says "change this slider", `Sandbox` says "try it yourself".
Code runs in a sandboxed iframe with no same-origin access.

```html
<l-sandbox run-label="Run">
const users = [];
if (users) console.log("truthy");
</l-sandbox>
```

Browsers block the sandbox frame on `file://`; serve the lesson over HTTP to
demo it (`python3 -m http.server`).

### `l-lab` — run the author's fixed variants, compare the output

Where `l-sandbox` says "edit and run your own code", `l-lab` says "run these
fixed variants and watch them differ". The code is written by the lesson author
and cannot be edited by the reader, so it is exactly as trusted as the lesson
itself and runs inline in the page — no iframe, which also means it works from
`file://`, where the sandbox frame is blocked. This is the primitive that turns
a mechanism the reader must *operate* (a buggy function beside its fix, two
strategies over the same input) into something they run themselves.

```html
<l-lab>
  <l-run label="As shipped">
    let total = 0;
    items.forEach(async i => { total += await price(i) });
    console.log(total);
  </l-run>
  <l-run label="Fixed">
    let total = 0;
    for (const i of items) total += await price(i);
    console.log(total);
  </l-run>
</l-lab>
```

Each `l-run` gets a Run button; a shared output console captures `console.log`,
`warn`, `error` and uncaught errors, with a short grace window for promises.
Keep each variant under ~30 lines and mostly synchronous — a lab that needs
more setup than a click will not get run.

---

## Learning

### `l-quiz` — see `quiz-modes.md`

### `l-contrast` — expected → actual → why

The move that makes a wrong answer teach something. Quizzes generate one
automatically when they have an `<l-actual>`; use it standalone after a
simulation, a benchmark, or a design decision.

```html
<l-contrast expected-label="What most people assume" actual-label="What the profiler says">
  <l-expected>The JSON parsing is the bottleneck</l-expected>
  <l-actual>94% of the time is in the N+1 queries</l-actual>
  <l-why><p>…</p></l-why>
</l-contrast>
```

### `l-checkpoint` — consolidate before moving on

Not an exam. A list of things the reader should now be able to say out loud.
Long explanations need these or the reader stacks new concepts on a broken base.

```html
<l-checkpoint title="Before you move on, you should be able to explain">
  <l-can>Why a low hit rate makes a cache nearly worthless</l-can>
  <l-can>What a TTL really is</l-can>
</l-checkpoint>
```

### `l-finish` — the ending

Required. Scores, the confidence read-out, the specific checks worth revisiting,
and where to go next. It updates live and links back to every check that went
wrong.

```html
<l-finish title="That's caching, honestly">
  <l-next><p>The natural next step is <b>invalidation strategies</b>…</p></l-next>
</l-finish>
```

---

## The effect protocol

Every control primitive ends up calling one method on a stage, which is what
stops them from each inventing their own way to poke the DOM. Any of these
attributes can be put on `l-scene`, `l-step` or `l-tstep`:

| attribute | effect on the stage |
|---|---|
| `stage="id"` | which stage to drive (defaults to the nearest one) |
| `focus="a b"` | highlight these parts, dim everything else; empty clears |
| `reveal="a b"` | un-hide these parts, permanently |
| `state="name"` | sets `data-state`; elements with `data-when` show only on a match |
| `step="2"` | forwards a step index to a trace, transform or flow inside |
| `layers="a b"` | show only these `data-layer` elements |

Events you can listen for: `story:scene`, `story:progress`, `step:change`,
`trace:step`, `quiz:answered`, `whatif:change`, `branch:pick`, `stage:change`.
