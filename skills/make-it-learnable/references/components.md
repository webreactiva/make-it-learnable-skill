# Component contracts

The lesson is assembled from a fixed catalogue of components. This file says
what each one **is for**, what it **takes**, how it must **behave**, and what
must **hold** when it ships. It deliberately says nothing about markup, class
names or code: you build each component your own way, in the single file you
deliver. Two lessons built from this catalogue may look nothing alike inside and
must behave identically outside.

Each component is a single job. Complex teaching objects are compositions, not
bigger components: a code walkthrough is `Split + Stepper + Focus + Trace +
StateBox`, not a `CodeWalkthrough`.

Nothing here fixes how a component looks — sizes, colours, shapes, layout and
motion are yours. Where a behaviour depends on a layout mechanic that is easy to
get wrong, `assets/skeletons/` holds an unstyled starting structure for it
(`wide.html`, `story.html`, `classify.html`): markup, hooks and only the
mechanics. Start from it, keep what the mechanics do, and style it your way. When a contract says "stands out" or "recedes", it names an
effect the reader must perceive, not a style.

Contract fields, in the same order every time:

- **For** — the teaching job. If the lesson does not need this job done, do not
  build the component.
- **Takes** — the inputs the blueprint gives it. Required ones are marked *.
- **Behaves** — what the reader sees and can do, including edge cases.
- **Holds** — invariants. Check every one before shipping (see SKILL.md, step 6).

## Contents

- [Structure](#structure) — `Shell`, `Hero`, `Section`, `Stack`, `Split`, `Stage`, `Drawing`
- [Narrative](#narrative) — `Story` + `Scene`, `Panels`, `Stepper`, `Branch`, `Picture`, `Analogy`
- [Attention](#attention) — `Focus`, `Reveal`, `Layers`, `Anatomy`, `Compare`
- [Behaviour](#behaviour) — `Transform`, `Flow`, `Trace`, `StateBox`
- [Experiment](#experiment) — `WhatIf` (inline and panel), `Sandbox`, `Lab`
- [Learning](#learning) — `Check` (see `checks.md`), `Contrast`, `Checkpoint`, `Finish`
- [Content blocks](#content-blocks) — `Code`, `BigNumber`
- [The effect protocol](#the-effect-protocol) — how controls talk to a stage

---

## Structure

### `Shell` — the page frame

**For** holding everything at a readable width.
**Behaves** as the frame of the page, with breathing room on every screen size.
Prose keeps a comfortable reading measure; stages, drawings and tables may use
more width.
**Holds** exactly one shell per lesson, and it starts with a `Hero`.

### `Hero` — what this is and why to read it

**Takes** `eyebrow` (subject · minutes), `title`*, `lede`*.
**Behaves** as the page's only top-level heading, with the eyebrow and the lede —
a short paragraph that promises a specific capability, not a topic.
**Holds** the title names the subject in the reader's words (see SKILL.md on
titles).

### `Section` — the unit of intent

One section, one idea being installed. Not a screen and not a scroll length.

**Takes** `id`*, `title`, `goal`*, `eyebrow`.
**Behaves** with a header: optional eyebrow and the title as a second-level
heading. The goal is **not shown** — it is the author's promise to themselves
about what this section installs, and printing it turns the page into a
syllabus. Let the title carry it.
**Holds** `id` is unique and URL-safe (the ending links back to it); the goal is
one sentence — if it needs two, the section is two sections.

### `Stack` — vertical rhythm

**Takes** `density`: tight | loose. Pure spacing. No teaching job.

### `Split` — two things visible at once

**For** when the reader would otherwise have to remember something that just
scrolled away.
**Takes** `ratio` 1:1 | 1:2 | 2:1, `sticky` (pin the second side).
**Behaves** as two sides visible together; with `sticky`, the second side stays
pinned while the first scrolls. On a narrow screen the sides stack and stop
pinning.

### `Stage` — the persistent representation

The single most important structural choice. Rather than diagram 1, diagram 2,
diagram 3, keep one object on screen and transform it. That is what builds causal
intuition instead of slideshow memory.

**Takes** `id`, `label` (a small caption above it), `sticky`, and content: a
`Flow`, a `Drawing`, a `StateBox`, a `Trace`… Every element inside that something
else will point at is a **part** with a name. A part may also be:
- **later** — hidden until a reveal names it;
- **when: X** — visible only while the stage's state is X (and hidden while no
  state is set — so once any beat uses `state`, give every beat on that stage its
  own `state`, or scrolling back shows the wrong one);
- **layer: L** — shown or hidden by `Layers`.
- **poses** — named positions (or sizes, angles, fill levels) the part can be
  in, plus an optional **path** it moves along between them. One part with poses
  is how a thing *moves*; several copies toggled by `when` is how it teleports.

**Behaves** as the one thing the [effect protocol](#the-effect-protocol)
changes. While anything is focused, the focused
parts must stand out unmistakably and everything else must recede — how is
yours. Hidden parts are invisible, out of the reading order and not clickable.
Under reduced-motion, nothing animates.
**A stage is wide — edge to edge.** It breaks out of the prose column and takes
the full width of the screen (see `assets/skeletons/wide.html`); and what it holds is laid out in landscape, so the reader
sees the whole picture large at a glance. A stage squeezed into a narrow box,
with its content shrunk to fit, is unreadable. With `sticky` it stays in view
while the prose next to it scrolls; inside a `Story` it is always pinned (see
there for the two arrangements).
**Holds** part names are unique within a stage; every effect that names a part
names one that exists **in the stage it resolves to** (see the protocol).

### `Drawing` — the picture only this subject has

`Flow` gives boxes on a grid and `Anatomy` gives labelled parts. They are right
when the idea *is* boxes and parts, and wrong more often than the catalogue makes
it look. A `Drawing` is a vector image you author for this one subject, under the
same effect protocol as everything else.

**Takes** a description of what it shows (one sentence, used as its accessible
name), a coordinate box, and the elements — each may be a named part, `later`,
`when: X` or `layer: L`, exactly like any other stage part.
**Behaves** by scaling to its container (fixed aspect ratio from its coordinate
box, no hard pixel size) — and that container is wide: a drawing is never placed
in a column, card or grid cell that leaves it small. **Draw in a wide format**: a landscape coordinate box,
roughly twice as wide as it is tall, never square or portrait unless the subject
is genuinely vertical. Leave margin inside the box — nothing touches its edges —
so the drawing does not look jammed against its frame. Focus is shown by everything else receding.
**Colours carry the meanings** in `runtime.md` → *Look and feel*, in both themes.
Labels stay readable at the size the
drawing actually renders, including on a phone.
**Holds** exposed to assistive tech as one image with that one-sentence label;
no external images, fonts or embedded foreign documents.

Read `visuals.md` before drawing anything. A correct drawing of the wrong thing is
still the wrong thing.

---

## Narrative

There are two narrative modes, and neither is the default.

| | reach for |
|---|---|
| one object the reader must watch change — a system gaining a component, a buffer filling, state moving through a machine | `Story` + `Stage` |
| several distinct questions, each answered by its own picture | `Panels` |

Getting this backwards has a specific cost. Independent drawings of *the same
system* let the topology drift between beats — draw a cache beside the database
in one panel and in the middle in the next, and you have taught read-through while
meaning cache-aside. If the beats are redraws of one thing, they are scenes on a
stage.

### `Story` + `Scene` — scroll position as narrative time

**For** the stretch of a lesson where one object has to transform, and the
reader has to *watch* it transform.
**Takes** a `Stage` and an ordered list of `Scene`s. Each scene: an optional
`name` (internal only, never shown), `stage` (which stage, if not the nearest),
the effects it applies (`focus`, `reveal`, `state`, `pose`, `step`, `layers`,
`fields`), and its `text` (one or two short sentences).
**Behaves**:
- **The stage is pinned for the whole story.** From the moment the first scene
  arrives until the last one leaves, the stage is on screen and does not move;
  only the scene texts scroll. A story's stage is always pinned, whatever its
  own `sticky` says. Choose one of two arrangements, and the stage must be large
  in both:
  - **over** — the stage fills the screen and the scene texts scroll *over*
    it, one screen apart, so only one text is ever over the drawing; the text
    sits in a band the drawing leaves empty and never covers the part being
    discussed. This is the arrangement for a wide picture, and the one to use
    on narrow screens. Start from `assets/skeletons/story.html`, which also
    carries the active-scene logic and a `travel` helper for poses.
  - **beside** — the stage takes the larger share of the width and the scene
    texts scroll in a narrower column next to it. Only when the picture still
    reads well at that size.

  Never put the stage above the scenes and let it scroll away, and never pin a
  stage so tall that no scene text fits beside or over it. The drawing fills the stage
  it is pinned in: drawn in the stage's proportion, with its parts spread over
  the full height — not a thin strip across the middle of an empty screen.
- **The stage acts, the text follows.** Every scene changes something the
  reader can *see* on the stage — something moves, appears, fills, turns, lights
  up. A scene whose only change is its text is not a scene: merge it.
- **One thing that goes somewhere is drawn once.** If the story is about
  something travelling — round an orbit, down a pipeline, through a queue — draw
  it a single time and move it with `pose`. Drawing it at every position at once
  and lighting up one per scene is a `Picture` with a highlight, not a story:
  the reader never sees it move.
- **Movement is shown, not implied.** When a part moves between scenes it is
  given a `pose` (see the protocol), and it **travels** from where it was to
  where it goes over a fraction of a second — along its `path` if it has one (an
  orbit, a wire, a queue), in the direction the story runs; backwards when the
  reader scrolls back. Anything else that changes size, angle or amount
  changes gradually the same way. A part that teleports between scenes has not
  shown the reader anything. Under reduced motion every change is instant.
- Each scene gives the reader enough scroll to finish reading it before the
  stage moves on, and no more than that.
- The **active scene** is the one whose centre is nearest the middle of the
  viewport, among those crossing the middle ~10% band. Recompute on every
  scroll, including when a scene *leaves* the band — otherwise scrolling back up
  skips a scene and the stage shows the one below.
- Activating a scene applies its effects to its stage. The active scene is
  clearly the one being read; the others recede (not under reduced motion).
- **The stage always shows exactly scene N**, however the reader got there —
  scrolling down, scrolling back, a deep link, a reload half-way. Reveals
  accumulate (scene N applies every reveal from 1…N); a part's pose is the last
  one set at or before scene N, otherwise its starting pose; state is scene N's
  own. Focus does not accumulate — every scene sends its own (an empty focus
  clears).
- The first scene is active on load.
**Holds** scroll through every scene, down and back up, and look: the stage
never leaves the screen, every scene changes it visibly, every moving part
travels rather than jumps, and scrolling back retraces the same movement in
reverse. One beat per scene — three facts in one scene means the stage moves
while the reader is still reading. Seven one-sentence scenes is five viewports
of scrolling: if beats are that short, merge them or use `Panels`. Wrap only the
sections where something transforms; never the whole lesson.

### `Panels` — a sequence of beats, each with its own picture

The inverse of a story: no pinned stage, no scroll logic, no script needed.
Each beat is a full-width picture with a sentence over it; the page reads with
scripting disabled.

**Takes** `numbered` (yes/no) and three or more `Panel`s. Each panel: `title`*
(a sentence that makes a claim), a short caption, and either a `Drawing` or a
`BigNumber`.
**Behaves**: the beats come **one after another, down the page — never side by
side in columns or a grid**. Each beat's picture goes edge to edge, out of the
prose column (`assets/skeletons/wide.html`), so it is large; three pictures squeezed into one row are three thumbnails
nobody can read. The picture carries each beat; the caption only frames it. With
`numbered`, each beat
gets a visible counter — right for things the reader counts off, noise for
an argument.
**Holds** at least 3 panels; every title is a sentence, not a one-word topic;
every panel has something to look at; captions stay near 15 words and never pass
25. Whatever recurs across panels keeps the same shape in the same place.

### `Stepper` — discrete, reversible progression

**For** when the reader needs to go back, repeat, or compare two steps — three
things scroll is bad at.
**Takes** `stage`, `start` (index, default 0), and two or more steps, each with
prose and effects.
**Behaves** with a control bar: previous and next buttons (accessible names
`control.prev` / `control.next`), a `control.stepCount` counter, and one dot per
step with the current one lit. Only the current step's content is visible.
Changing step applies that step's effects to the stage. Previous is disabled on
the first step and next on the last; the index clamps.
**Holds** at least 2 steps.

### `Branch` — the explanation forks

**For** two readers who genuinely need different routes.
**Takes** `question`, `rejoin` (a sentence shown after the paths), and two or
more paths, each with a `label`* and content.
**Behaves**: the question, then one button per path. No path is shown until one
is picked; picking shows that path, hides the others, and marks its button as
the primary one. The rejoin sentence is always visible below.
**Holds** at least 2 paths, each labelled.

---

### `Picture` — a beat that is only a picture

**For** the most common moment in a lesson: one idea that a drawing can say on
its own. It is the default beat; a paragraph is what you reach for when no
picture can carry the idea.
**Takes** `Drawing`*, `caption`* (one short sentence), `title` (optional, a
claim, not a topic).
**Behaves** as a drawing edge to edge — out of the prose column, the full width
of the screen (`assets/skeletons/wide.html`) — with the caption under it. No paragraph before or after that repeats what the drawing shows. The
drawing makes its point with shapes, positions, sizes and the colour meanings;
labels name things, they do not explain them.
**Holds** caption ≤ 15 words; a reader who skips the caption still gets the idea
from the drawing alone — if they cannot, redraw it before adding words.

### `Analogy` — the thing they know, mapped onto the thing they don't

**For** introducing a concept through something the reader already handles every
day — a torch on a wall for sunlight on the ground, a queue at a till for a
request queue, a library index for a database index.
**Takes** `familiar`* (a `Drawing` of the everyday thing), `concept`* (a `Drawing`
of the real thing), `pairs`* (two or more { `familiar`: part, `concept`: part,
`label` } matches), `breaks` (one sentence: where the analogy stops holding).
**Behaves** as two drawings, one after the other, each edge to edge
(`assets/skeletons/wide.html`) — never shrunk side by side in two columns — the
familiar one first. Each pair is visibly linked: picking or
hovering a part on one side singles out its match on the other, using the
"thing under discussion" meaning. A drawing is one image to assistive tech, so
the pairs are also reachable as a short list of focusable controls (one per
pair, named by its `label`) that drive the same highlight. Matching parts look alike in
both drawings — same shape, same place, same meaning colour — so the mapping is
seen before it is read. `breaks`, when given, sits after both drawings: the
point where the analogy would start teaching something false.
**Holds** every pair names a part that exists in its drawing; the familiar thing
is really familiar to *this* audience; an analogy that needs a paragraph to set
up is the wrong analogy. Use at most one or two per lesson — a lesson made of
analogies never shows the real thing.

---

## Attention

### `Focus` — say where to look

**Takes** `target`* (part names), `stage`.
**Behaves**: inside a scene, step or trace step it is just that beat's `focus`
effect. Standalone, it fires when it scrolls into the middle ~20% of the
viewport, so no primitive is ever scroll-only.

### `Reveal` — introduce information when it earns its place

Two forms.
- **On a stage** (inside a scene or step): `target` names parts to un-hide. Part
  of the `reveal` effect, and accumulates in a story.
- **Standalone**: `label` (default `reveal.button`) and hidden content. A
  button; pressing it shows the content and removes the button. Code inside the
  revealed content is highlighted at that moment.

### `Layers` — one drawing, several questions

**Takes** `stage`, `layers`* (names), `default` (which start on; else the first),
and an optional display label per layer.
**Behaves** as one checkbox per layer. The stage shows only parts whose layer is
switched on; parts with no layer are unaffected.
**Holds** every declared layer exists on some part of that stage.

### `Anatomy` — what parts does it have

**For** decomposing one entity into inspectable parts: code, a prompt, a URL, an
HTTP response, JSON, a document.
**Takes** `hint` (default `hint.anatomy`) and two or more
parts, each with a `label`* and a note.
**Behaves** as the parts, each selectable, and a detail area that starts with the hint. Selecting a part (click,
Enter or Space) marks it active and shows its label as a heading plus its note.
**Holds** at least 2 parts; every part has a note — a part that shows nothing is
a dead control.

### `Compare` — alternatives on shared dimensions

**Takes** `label` (corner cell, written in the lesson language), two or more `columns`, and criteria — each a
`name` with exactly one cell per column.
**Behaves** as a table with a header row and one row per criterion. With more
than one criterion, a row of toggle chips (one per criterion) sits above it:
pressing a chip highlights that row and dims the others; pressing it again, or
another chip, changes the selection. Chips expose their pressed state. On a
narrow screen every cell stays readable without sideways scrolling — rearrange
it (for instance one block per column) rather than shrink or scroll it.
**Holds** at least 2 columns; every criterion has exactly as many cells as there
are columns. Reveal criteria one at a time in prose rather than dumping the table.

---

## Behaviour

### `Transform` — A becomes B

**For** pipelines: source → AST, prompt → tokens, spec → plan → code.
**Takes** two or more phases, each a `name` and optional body.
**Behaves** as phases in a row joined by arrows. Receives `step` from the effect
protocol: phase *i* becomes the active one.

### `Flow` — movement between entities

**For** a list of named things and which way they talk.
**Takes** `cols` (default min(nodes, 3)), nodes — each `id`* (doubles as its part
name), label, optional small sublabel, optional `row`/`col` placement, any part
flags — and edges, each `from`*, `to`*, optional `label` and `layer`.
**Behaves**:
- Nodes sit on a grid; edges are curves drawn **between the real rendered boxes**
  and redrawn whenever the size changes or the stage changes, so rewording a node
  never breaks an arrow. Edges leave from the side facing the target (top/bottom
  if the vertical distance dominates, left/right otherwise) and end in an
  arrowhead.
- Edge labels sit at the curve's midpoint on a small rounded backing so they stay
  legible over the drawing, painted above the nodes. When a horizontal hop is too
  short for its label, drop the label just below both boxes instead of letting it
  collide with node text.
- An edge touching a hidden (`later`, not yet revealed) node stays hidden.
- Receiving `step` *i* lights edge *i* and sends a small dot travelling along it
  (~800ms); under reduced-motion, light it without the dot.
- In a narrow container, nodes stack in one column and ignore placement.
**Holds** every node has an id; every edge's ends name nodes in the same flow.

### `Trace` — one concrete execution

`Flow` explains the system in the abstract; `Trace` answers "what happened in
*this* run". Give the concrete instance first.
**Takes** `stage`, `start`, and steps — each a short label, a `detail` sentence,
and optional effects.
**Behaves** as a vertical list of selectable steps plus a detail line. Selecting
step *i* (click, Enter, Space) marks it active, marks earlier ones as past,
shows its detail, and applies its effects to the stage.

### `StateBox` — make the invisible visible

**Takes** `name` (a heading) and fields, each a `key`* and initial `value`.
**Behaves** as a key/value list. The `fields` effect updates values by
key; a value that actually changes flashes briefly so the eye catches it.

---

## Experiment

### `WhatIf` — a small causal laboratory

Two forms, and choosing between them matters.

**Inline (reactive document).** The numbers live inside the sentence and the
reader scrubs them in place — reading and manipulating are the same act. Use when
the relationship *is* the sentence.
**Panel.** Controls and readouts together — for when the reader should hunt for
a threshold.

**Takes** variables and outputs.
- Variable: `name`*, `label`, `min`, `max`, `step`, `value`, `unit`. Panel form
  adds `type`: range (default) | toggle | select (with `options`).
- Output: `name`, `label`, `expr`* (an expression over the variable names),
  `unit`, and optionally `good` (low | high) with `threshold`.

**Behaves**:
- *Inline variable*: shown as its value plus unit, styled so it is obviously
  draggable and different from the outputs. Dragging horizontally changes it by
  one `step` every few pixels;
  arrow keys move one step (×10 with Shift). It clamps to min/max and snaps to
  step. It is exposed as a slider with label, min, max and current value. Put the
  one-line hint `hint.whatif` under the paragraph.
- *Panel variable*: label and live value above a slider, a switch showing on/off,
  or a dropdown.
- Every change recomputes every output. Numbers round to two decimals. An
  expression that fails shows "—". With `good`/`threshold`, the output turns the
  reads as right when on the good side and as wrong otherwise.
- The first real interaction counts as exploring the model (see scoring in
  `runtime.md`).
- **Expression safety.** Evaluate with `LessonCore.evaluate(expr, values)` from
  `assets/lesson-core.js` — never with the language's eval, which the page's
  security policy blocks anyway. It accepts numbers, the declared variable
  names, `true`/`false`/`null`, arithmetic, comparison, logical operators, the
  conditional `a ? b : c`, parentheses, `Math.PI`, and only these math helpers:
  abs, ceil, floor, max, min, pow, round, sqrt, sin, cos, tan (radians; written
  `Math.sin(x)` or just `sin(x)`); it
  rounds to two decimals and throws on anything else (show "—").
There is no text in expressions: when the honest relationship needs it (named
cases, lookups), do not fake it with an approximation — show the source's
values in a `Compare`, a `StateBox` driven by a `Stepper`, or prose.
**Holds** at least one variable and one output; every name an expression uses is
declared in the same WhatIf; inline variables have an explicit starting value.
**The model must be honest** — see SKILL.md. If you cannot defend the formula,
use `Compare`.

### `Sandbox` — open-ended experimentation

**For** "try it yourself" with code the reader edits.
**Takes** starting code and an optional run label.
**Behaves** as an editable code area (4–20 rows, spellcheck off), `lab.run` and `lab.reset`
buttons, and an output area. Run executes the code in an **isolated, scriptable,
no-same-origin frame**, captures log/warn/error and uncaught errors (objects
shown as JSON), marks errors as wrong, and discards the frame when done
or after ~4 seconds. Reset restores the original code and clears the output.
Running counts as exploring.
**Holds** never runs in the lesson's own context. Browsers block such frames on
`file://`: leave Sandbox out of a lesson people will open locally, or say it
needs to be served over HTTP.

### `Lab` — run the author's fixed variants, compare the output

**For** a mechanism the reader should *operate*: a buggy function beside its fix,
two strategies on the same input. Works from `file://`. Prefer it to `Sandbox`
unless the reader must edit.
**Takes** `runs`: two or more variants, each a `label` and fixed code (≤ ~30
lines).
**Behaves**: each variant shows its label, a `lab.run` button and its highlighted
read-only code. One shared output console starts with `lab.idle`. Running a variant clears the console, prints "▸ label", then
executes the code in a **disposable classic (non-module) background worker** (no
access to the page, sloppy mode unless the variant opens with its own strict
directive — so wrap the variant so its code is the first thing in its function
body) with async/await allowed, capturing log, warn (marked in between) and error (marked
wrong) — logged objects as JSON — plus thrown errors, printed by their message. A hard **2-second** timeout terminates the worker
and prints `lab.timeout`. Running counts as exploring.
**Holds** variants finish well under the budget; the boundary is never weakened
to make an example easier.

---

## Learning

### `Check` — see `checks.md`

The seven mechanics, the shared shell, feedback and confidence.

### `Contrast` — expected → actual → why

**For** making a gap visible: after a simulation, a benchmark, a design decision.
Checks with an `actual` generate one automatically — with the two cells only;
the check's why is shown separately, never twice.
**Takes** `expected`*, `actual`*, `why`, and optional custom labels.
**Behaves** as the expected and the actual side by side (stacked on a narrow
screen), labelled `contrast.expected` and `contrast.actual`; and, if there is a why,
`contrast.gap` after both.

### `Checkpoint` — consolidate before moving on

Not an exam: things the reader should now be able to say out loud.
**Takes** `title` (default `checkpoint.title`) and
two or more statements.
**Behaves** as a titled list of statements, each a toggleable checkbox (click,
Enter, Space; exposes checked state) with a meter, `checkpoint.meter`.
Confirming or un-confirming feeds scoring.
**Holds** one every three or four sections.

### `Finish` — the ending

Required. The last teaching move, not a scoreboard. Its full behaviour — the
four readings, the ring, the stats, the badges, the revisit links — is in
`runtime.md` because it reads the score state.
**Takes** `title`, and `next`* — prose saying where to go next and what the
lesson deliberately left out.
**Holds** exactly one, at the end; `next` states the honest scope.

---

## Content blocks

### `Code` — real code, highlighted

**Takes** a language and verbatim code.
**Behaves** as a monospaced block labelled with its language, coloured by token
kind (comment, string, keyword, number, function, type, punctuation). Build a tiny highlighter — one combined pattern
scanned left to right, where the first alternative wins at each position, so
comments beat strings beat keywords — for the languages the lesson actually
uses. A language without a grammar still renders, labelled and plain. Code is
escaped, never interpreted as page structure.
**Holds** quoted verbatim from the source; code that a `spot` check makes
clickable is **not** highlighted (its regions are the interaction).

### `BigNumber` — a figure as the picture

For a panel whose payload is one number with its unit: the number is the
drawing.

---

## The effect protocol

Every control component ends by sending one message to one stage. That is what
stops each of them inventing its own way to poke the page. A `Scene`, a `Stepper`
step, a `Trace` step and a standalone `Focus` all speak it:

| effect | what the stage does |
|---|---|
| `stage` | which stage receives it (otherwise the nearest stage in the same section or story, otherwise the first on the page) |
| `focus: [parts]` | highlight these, fade every other part; an empty list clears focus |
| `reveal: [parts]` | un-hide these `later` parts, permanently |
| `state: X` | set the stage state; parts marked `when: X` show, other `when` parts hide |
| `pose: {part: pose}` | move each named part to one of its declared poses — it travels there, along its path if it has one |
| `step: i` | forward the index to a `Trace`, `Transform`, `Flow` or `Stepper` inside the stage |
| `layers: [L]` | show only parts on these layers |
| `fields: {key: value}` | update the `StateBox` inside the stage |

Omitted effects leave the stage as it is, except focus, which every beat sends.
Components may also announce what happened (scene changed, step changed, check
answered, model changed, path picked) so the chrome can react; how you wire that
is yours.
