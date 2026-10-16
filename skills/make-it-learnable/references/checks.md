# Checks: seven mechanics

A check is never "question plus four answers". It is an engine for confronting a
mental model, and it always has the same four beats:

```
situation → the reader acts → evaluation → feedback
```

Only the middle beat changes. Seven mechanics cover the useful space; more than
that and you are inventing variants, not teaching. This file specifies the
shared shell once, then each mechanic's inputs and behaviour. How you build them
is yours; what the reader experiences is not.

## The shared shell

**Takes**, for every mechanic:

| input | what it does |
|---|---|
| `mode`* | one of the seven below |
| `id` | anchor for the ending's revisit links; generate one if absent |
| `prompt`* | the question |
| `situation` | code, a diagram or context shown between the prompt and the interaction |
| `why`* | the explanation, revealed after answering. **Effectively required.** |
| `miss: {option: text}` | what someone believes if they pick that wrong option |
| `actual` | the real result; turns the feedback into an expected-vs-actual `Contrast` |
| `confidence` | adds the confidence slider |
| `kind label`, `submit label` | overrides for the chrome text |

**Behaves**:

1. A **kind label** naming the mechanic — `kind.MODE` (e.g. `kind.prediction`) — then the prompt, then the situation, then the interaction.
2. The **Check** button stays disabled until the reader has done enough to be
   judged (the per-mode "ready" rule below). Some mechanics are ready the moment
   they are built (`arrange`, slider `estimate`), so build the shell — button
   included — **before** the mechanic, and let the mechanic report readiness to
   it. Reporting readiness to a shell that does not exist yet is the most common
   way this page breaks.
3. With `confidence`: above the button, `confidence.question` and a 0–100
   slider starting at 50, ends labelled `confidence.low` and `confidence.high`.
4. Pressing Check — once only — locks the interaction, turns the button into a
   disabled `check.done` (it read `check.submit`), and opens the feedback, in
   this order:
   - a **verdict** — `verdict.right` · `verdict.wrong` · `verdict.partial` (in
     between) · `verdict.open` (neutral) — each visibly different;
   - a **Contrast** of what the reader said against `actual`, when there is an
     `actual` (or the mode produces one);
   - any mode-specific extra (estimate bar, key ideas…);
   - the **miss** note for the option they picked, if the verdict is not right —
     shown in a highlighted note, because naming the belief beats "wrong";
   - the **why**;
   - a **confidence note** when it is informative: wrong at ≥70 → "You were
     confident and it did not hold — that usually means a rule you trust has an
     edge you have not met yet. Worth rereading the explanation slowly."; right
     at ≤30 → "You got it but did not trust it. The reasoning above is the part to
     lock in." The slider locks.
5. The result goes to scoring (`runtime.md`), and code in the feedback is
   highlighted.

Before answering, the why, the misses and the actual are invisible — not merely
collapsed, not in the reading order.

**Holds** (all mechanics): a prompt and a why (or a reference answer for
`explain`). For mechanics with options (`choose`, `prediction`, bucketed
`estimate`): every wrong option has a miss, and every miss names an option that
exists. In `spot`, misses are optional and keyed by region.

**Write the why first**, then work backwards to a question that makes it land. A
check that says "wrong" and stops has tested the reader and taught nothing — it
spends their attention and returns nothing.

**Keep options roughly the same length.** In bad multiple choice the right
answer is the long, carefully hedged one; readers learn to pick on shape, and
the check stops measuring anything.

**A miss is the highest-leverage text in the lesson.** "Incorrect" tells a reader
they failed. "You picked A because you are thinking of X, and here is where that
model breaks" tells them what to change. If you cannot name why someone would
pick an option, it is filler — delete it. Three real options beat four with a
decoy.

---

## 1. `prediction` — commit before the reveal

The strongest mechanic in the format; reach for it first. Reading an explanation
produces a convincing feeling of understanding that survives right up until you
have to predict something.

**Takes** options (as `choose`) or none (then it behaves as `explain`), and
`actual`*.
**Behaves** as `choose` or `explain`, but always ends in a Contrast: your
prediction against reality. The gap is the lesson, not the verdict.
**Holds** has an `actual`; with options, has an answer.

## 2. `choose` — the classic, kept honest

Use it when the concept really is a discrimination between named options.
**Diagnose** is this mode with symptoms in the situation and "what would you
investigate first?" as the prompt.

**Takes** two or more options (each a value — default A, B, C… — and text),
`answer`* (one value, or several for multi-select).
**Behaves**: options as selectable items, each with its letter.
Single answer → picking one unpicks the rest (radio semantics); several answers
→ independent toggles (checkbox semantics). Selected-but-unchecked must look picked, never right or
wrong. Ready when at least one is
picked. On check, correct options turn ok, wrongly picked ones turn bad.
Verdict: right if exactly the answer set was picked; partial if some correct
were picked; otherwise wrong. The reader's "said" (for a Contrast) is the text of
what they picked; the miss shown is for their first pick.
**Holds** the answer matches an option value; at least 2 options.

## 3. `spot` — find it in context

Recognition *in situ*, which is different from knowing a definition. A reader
can define a race condition and still not see one in forty lines of code.

**Takes** a situation containing named **regions** — a line, a token, a node in
a diagram, a cell — and `answer`* (one or more region names).
**Behaves**: regions are selectable toggles (click, Enter, Space) highlighted on
hover and when picked. Ready when one is picked. On check, answer regions turn
ok, wrongly picked ones turn bad. Verdict as in `choose`. A miss fires only when
exactly one region was picked (several picks name no one misconception).
For code, show it as plain monospaced lines with the regions inline — **not**
highlighted.
**Holds** at least one region; every answer is a region name.

## 4. `classify` — sort the confusable

Best mechanic for pairs people conflate: sync/async, compile-time/runtime,
state/derived state, server/client state.

**Takes** two or more buckets, each a `name` and the items that belong in it.
The blueprint lists items *inside their correct bucket*; there is no separate
answer key to keep in sync.
**Behaves**: a hint (`hint.classify`), an
pool holding every item shuffled (named `classify.pool` for assistive tech), and the named buckets. Items wrap
onto new lines and buckets stack when they do not fit side by side — nothing in
the check ever scrolls sideways or runs off the screen (start from
`assets/skeletons/classify.html`). Click-to-place, not
drag and drop — so touch and keyboard work: pick an item (it highlights; every
valid destination, pool included, shows it is armed), then pick a bucket or the
pool to put it there — by keyboard too, the pool included; picking the same
item again cancels. Ready when the pool
is empty. On check, each placed item turns ok or bad. Verdict: right if all are
in place, partial if some are, otherwise wrong.
**Holds** at least 2 buckets, each named, each with at least one item.

## 5. `arrange` — reconstruct the sequence

For protocols, pipelines, algorithms, request lifecycles, agent loops.

**Takes** three or more items in the **correct** order; optionally `low` and
`high` end labels, which turn it into a **ranking** by a property (coupling,
cost, risk) instead of time.
**Behaves**: the items as a numbered list in shuffled order (reshuffle if the
shuffle happens to equal the answer). Each row has move-up and move-down buttons
(accessible names `control.up` / `control.down`); up is disabled on the
first row and down on the last. Moving relocates the row and keeps keyboard
focus on the row that moved — if the button just used became disabled, focus
its sibling. Each row announces `control.position`. With `low`/`high`, the
two labels sit at the top and bottom ends. Ready immediately. On check, rows in
the right position turn ok, others bad, and all buttons lock. Verdict: right if
all are in place, partial if at least half are, otherwise wrong.
**Holds** at least 3 items; both `low` and `high` or neither.

## 6. `explain` — produce it, don't recognise it

Recognition is cheap and feels like knowledge. Generation is the real test.
Deliberately not graded strictly — the value is the reader writing the
explanation, then seeing which pieces they left out.

**Counterexample** is this mode with the prompt inverted: state a rule the reader
believes and ask where it breaks. **Debug** is this mode, or `spot`, with code,
observed behaviour and expected behaviour in the situation.

**Takes** key ideas — each a visible text and a case-insensitive pattern that
detects it — and/or a reference answer, and an optional placeholder (default `hint.explain`).
**Behaves**: a free-text area. Ready once the answer is longer than 10
characters. On check the text locks, then the feedback shows `explain.keys` — each
idea marked as hit or not — and `explain.reference`.
Verdict: right if every key idea was hit, partial if some, otherwise open; with no key ideas, always open.
**Holds** at least one key idea or a reference — otherwise the reader gets no
feedback. Keep patterns generous: you are checking whether an idea is present,
not marking spelling.

## 7. `estimate` — make quantitative intuition explicit

Engineers carry rough numeric models and almost never test them. Good for
latency, tokens, memory, cost, complexity, scale.

**Takes** `min`*, `max`*, `step`, `unit`, `actual`*, `tolerance` (a fraction of
`actual`, default 0.25). Given options instead, it becomes bucketed `choose`.
**Behaves**: a slider starting at the midpoint, with min, current value and max
shown beneath it. Ready immediately. On check: the slider locks, and a bar
appears with two markers — `estimate.you` and `estimate.actual` — at their
positions on the range, plus the line `estimate.line`. Relative error
= |you − actual| / actual. Verdict: right within `tolerance`, partial within
twice it, otherwise wrong.
**Holds** slider form has `actual`, `min` and `max`. Be generous with tolerance:
you are testing an order of magnitude, not arithmetic.

---

## Confidence, and why it earns its slider

Four outcomes, and only two are interesting:

| | correct | wrong |
|---|---|---|
| **confident** | fine | **the valuable one** |
| **unsure** | worth locking in | expected |

Confident-and-wrong is a belief the reader actively trusts that does not hold —
exactly what an explanation exists to fix, and invisible without the slider. The
ending calls it out by name.

Use `confidence` on the two or three checks where a misconception is likely, not
on every one; asked constantly it becomes a tic.

## Where a check goes

A check directly under the section that taught it measures working memory: easy
to pass, weak evidence. A check that reaches back two or three sections measures
whether the idea is retrievable at all. Put most checks after their teaching —
the reader needs the win — and at least one where it is not. The `Checkpoint` is
the natural place for the reaching-back kind.

## Choosing a mechanic

| what you want to know | mechanic |
|---|---|
| does their mental model produce the right output? | `prediction` |
| can they recognise the concept in real material? | `spot` |
| can they tell two confusable things apart? | `classify` |
| do they understand the process? | `arrange` |
| can they order by a property? | `arrange` with `low`/`high` |
| can they generate the explanation? | `explain` |
| is their sense of scale right? | `estimate` |
| is it genuinely a choice between named options? | `choose` |
