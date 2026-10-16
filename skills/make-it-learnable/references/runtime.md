# The page and its chrome

Every lesson shares the same envelope, the same scoring rules and the same kinds
of feedback. It does **not** share a look. This file says what the page must
contain and how it must behave; how it looks is decided per lesson (see *Look and
feel* at the end). Like `components.md`, this is a behaviour contract — the
implementation and the design are yours.

---

## The file

One self-contained HTML file. No build step, no network, no dependencies. It
must open from a USB stick in ten years.

- **Everything inline**: styles, scripts, the favicon, any images (data URIs
  only). No external stylesheets, scripts, fonts, images or frames.
- **Document language** set to the lesson language (`en`, `es`…), title and a
  one-sentence description set from the blueprint.
- **Viewport** set for mobile; **UTF-8** declared.
- **Content security policy**, declared in the document head, exactly:

  `default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none'; worker-src blob:; frame-src 'self'; base-uri 'none'; form-action 'none'`

  It blocks every network connection. Do not loosen it to make an example work.
- **Favicon**: `assets/favicon.svg`, inlined as a URL-encoded SVG data URI (collapse
  its whitespace first). Never link it as a file.
- **No inline event-handler attributes** and no links except in-page anchors and
  absolute http(s) URLs. Lesson content never injects executable code into the
  page; only `Sandbox` and `Lab` run code, and only inside their isolation.
- **The stylesheet starts with this rule**, before anything of yours:

  `button, input, select, textarea { color: inherit; font: inherit; }`

  Form controls do not inherit the page's text colour or font; without it,
  every button you style later and forget to give a colour shows the
  browser's dark default text — unreadable on a dark surface. It sets no look
  of its own: the controls just take whatever your page uses.
- **Webfonts are forbidden.** Use fonts installed on the reader's system, or none
  at all beyond the generic families.

At the end of the page, after the shell, in this order:

1. **Sources** — a region titled `sources.title`, visibly separated from the
   lesson, listing every source from the blueprint: a link
   (opening with no referrer) when it has an absolute http(s) URL, plain text
   otherwise. At least one entry, always. For general knowledge, a truthful label
   such as `sources.generalKnowledge`.
2. **Signature** — a quiet footer: the favicon as a small image, then
   `signature.text`, with the site name linking to `signature.link` and the
   heart announced to assistive tech as `signature.heart`. These keys are
   language-independent (`any:` in `strings.yaml`): a signature, not chrome, so
   it does not count as mixing languages.

---

## Progress rail

An always-visible, unobtrusive indicator of how far through the page the reader
is (the fraction scrolled; 0 when the page does not scroll). It works with or
without a `Story` — it owns its own scroll tracking. Its form is yours.

## Score display (HUD)

Appears only if the lesson has at least one check, created lazily the first time
there is something to show.

- Stays in view while reading, never covers content the reader needs, never
  intercepts clicks.
- Shows the points total with `hud.points`.
- Shows `hud.streak` while the streak is 2+, otherwise `hud.answered`, and
  looks different while on a streak.
- When a previous best exists, shows `hud.best`; once this run has passed it,
  that is replaced by `hud.newBest`, marked as an achievement.
- **Awards are announced**: every award briefly shows "+N" and its reason,
  then goes away on its own within a few seconds; a badge shows "★" and its name.
- Hidden in print.

---

## Scoring

Explorable explanations are normally defined *against* gamification. This layer
exists only because it makes the confident-and-wrong case visible, and it pays
for exactly three things: committing to an answer before the reveal, being
honest about confidence, and touching the model. Never for clicking around.

**Use `assets/lesson-core.js` for this.** Inline it unchanged into the lesson's
script and call `LessonCore.createScore({ key: the page title, checks: number of
checks, statements: number of checkpoint statements, onAward, onBadge, onChange })`.
Create it **before** setting up any component — checks and models call it. It returns `answer({ id, prompt, mode, verdict, confidence })` (which also tells
you which confidence note to show), `explore(kind)`, `checkpoint(id, on)`,
`reading()` and `state()` (a snapshot of the run that also carries `reading`). It has no DOM and no styling: you render the score,
the award announcements and the ending from its callbacks, your own way. The
rules below are what it implements.

**Per answered check** (each check answers once):

| | points |
|---|---|
| verdict right / partial / open / wrong | 100 / 45 / 40 / 10 |
| streak bonus, when right and the streak is >1 | + min(75, (streak − 1) × 15) |
| mode is `prediction` or `estimate` | + 15 |
| calibrated (with confidence): right at ≥65, or wrong at ≤35 | + 25 |

Here **wrong means any verdict that is not right** (partial and open included).
Award reason: `toast.correct` if right, otherwise `toast.committed`. A
right answer extends the streak; anything else resets it to 0. Wrong at ≥70
confidence counts as **overconfident**. The thresholds differ on purpose: ≥65 /
≤35 for calibration points, ≥70 / ≤30 for the feedback notes in `checks.md`. Every non-right check is added to the
**revisit** list with its id and prompt text.

**Exploring the model**: 10 points, once per kind (inline WhatIf, panel WhatIf,
Sandbox, Lab), reason `toast.explored`.

**Checkpoint statements**: 15 points the first time each one is confirmed
(reason `toast.checkpoint`); un-confirming lowers the count but not the points,
and re-confirming does not pay again — ticking is not something to farm.

**Badges**, each awarded once (a lesson with fewer than three checks cannot earn
`badge.streak` or `badge.calibrated` — that is fine):

| badge | when |
|---|---|
| `badge.committed` | every check in the lesson answered |
| `badge.clean` | every check answered and all right |
| `badge.streak` | a streak of 3 |
| `badge.calibrated` | 3 calibrated answers |
| `badge.handsOn` | first exploration of any model |
| `badge.consolidated` | every checkpoint statement confirmed |

**Personal best.** The run lives in memory; a reload starts over, which is what a
reload should mean. Only the best total survives, in local storage under a key
derived from the page title (all `file://` pages share one origin). Read it once
at load — that frozen value is the run being raced. Whenever the points exceed
the stored record, write {points, right, total, timestamp}. Every storage access
is guarded: private windows and some `file://` contexts throw on the accessor
itself, and the lesson must work regardless.

---

## The ending (`Finish`)

Re-renders live whenever the score changes. Top to bottom:

1. **Head** — `finish.eyebrow`, the title (default `finish.title`), the
   **reading**, and a visual of the percentage of checks right, showing the
   percentage and `finish.correct`. The form of that visual is yours.
2. **The reading** — the most useful line on the page, one of four, chosen by
   `reading()` in `lesson-core.js`:
   - not every check answered → `reading.partial`
   - any overconfident answers → `reading.overconfident.one` / `.other`
   - 3+ calibrated answers → `reading.calibrated`
   - otherwise → `reading.done`
3. **Stats** — four figures: points (`finish.points`) · right/total
   (`finish.checksCorrect`) · best streak (`finish.bestStreak`) ·
   confirmed/total (`finish.checkpoints`).
4. **Badges** earned (★ name + description each, from `badge.*`), or
   `finish.badgesEmpty`.
5. **Revisit** (`finish.revisit`) — links to each missed check by its anchor,
   showing its prompt; when every check is done and none missed,
   `finish.revisitNone`.
6. **Next** (`finish.next`) — the blueprint's `next` prose.
7. Two buttons: `finish.top` (smooth scroll) and `finish.again` (reload).

Points are the smallest thing on it. If the lesson would be worse with the HUD
removed, fix the lesson.

---

## Chrome text

Every text the page generates comes from `references/strings.yaml`, by key, for
the document language; this skill's markdown names keys (`verdict.right`), never
the text. Use the block that matches the lesson language. If it does not exist,
write a complete block with every key and add it to `strings.yaml` before
building — never ship a page that falls back to another language for some
strings. The wording may be adapted to the lesson's voice; the meaning may not.

---

## Look and feel

**The look is entirely yours.** Nothing in this skill decides colours, fonts,
shapes, sizes or layout. What it does decide is what colour has to *mean*, and a
few things the page must do for every reader.

**What colour has to mean.** The reader learns these in the first minute and
relies on them for the rest, so each meaning keeps one treatment everywhere —
prose, checks, drawings, score — and none can be mistaken for another:

- **the lesson itself** — what marks headings, progress and the main actions as
  belonging to this lesson;
- **"you can act on this" / "this is what you picked"** — anything touchable,
  and a choice made but not yet checked. It must never look like right or
  wrong: before the check, the reader has not been judged;
- **right** — this held, this succeeded;
- **wrong** — this did not hold, this failed. Nothing else may borrow it: if
  the lesson's own colour resembles "wrong", every heading reads as an error;
- **in between** — partly right, a warning;
- **the thing under discussion** vs **context** — in a drawing or on a stage,
  what to look at now, against what is just scenery;
- **reading** — text and background, which should never compete with the
  content.

Right and wrong are never told by colour alone — pair them with a mark or a
word.

**What the page must do for every reader:**

- Follow the system light/dark preference (an explicit override on the document
  root wins), with every meaning above still holding in both, drawings and code
  included; print legibly.
- Body text and controls meet WCAG AA contrast.
- **Text on anything the reader can act on** — buttons, chips, options, choice
  tiles, disabled buttons included — is readable against its own surface, in
  both light and dark and in every state (idle, hovered, picked, right, wrong,
  disabled). The inherit rule in *The file* makes controls take the page's
  text colour; a control whose surface you change (a picked chip, a filled
  button) needs its own text colour set in the same rule as that surface. Look
  at each one in both modes before shipping.
- Keyboard focus is always visible.
- Works at phone width with no horizontal page scroll.

### Robustness

Initialize every component independently, each guarded, so that one failing
component logs its error and leaves the rest of the lesson working. A single
uncaught error at load must never take down the checks, checkpoints and ending
that come after it. The console must be clean on load.

- Wrap each component's set-up in `LessonCore.guard(name, fn)` — one call per
  component instance, not one around the whole script.
- If you embed data in the page for a component to read, put it in a
  `<script type="application/json">` block and read its text. A `<template>`'s
  text is always empty (its content lives in a separate fragment), so parsing
  it fails.

### Motion, print, access

- Reduced-motion: no smooth scrolling, no transitions or travelling dots, scenes
  never dimmed.
- Print: HUD and progress rail hidden; everything else readable on paper.
- Every interactive thing works by keyboard (Enter/Space on custom controls,
  arrows on scrubbable numbers) and exposes its role and state (button, radio,
  checkbox, slider, pressed, checked).
- Layout works at phone width with no horizontal page scroll.
