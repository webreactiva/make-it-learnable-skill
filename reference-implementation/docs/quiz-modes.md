# Quiz: seven mechanics

A quiz is never "question plus four answers". It is an engine for confronting a
mental model, and it always has the same four beats:

```
situation → the reader acts → evaluation → feedback
```

Only the middle beat changes. Seven mechanics cover the useful space; more than
that and you are inventing variants, not teaching.

Every quiz supports:

| attribute / child | what it does |
|---|---|
| `confidence` | adds a confidence slider; unlocks the calibration feedback |
| `<l-prompt>` | the question. Required. |
| `<l-situation>` | code, diagram or context shown above the interaction |
| `<l-why>` | the explanation, revealed after answering. **Effectively required.** |
| `<l-miss for="value">` | what someone believes if they pick that wrong answer |
| `<l-actual>` | the real result; triggers an automatic `l-contrast` |

`<l-why>` is where the teaching happens. A quiz that says "wrong" and stops has
tested the reader and taught them nothing; it is worse than no quiz, because it
spends their attention and returns nothing for it.

**Keep the options roughly the same length.** In a badly written multiple choice
the right answer is the long, carefully-hedged one and the decoys are curt —
so readers learn to pick on shape rather than on meaning, and the check stops
measuring anything. Match them in word count.

`<l-miss>` is the highest-leverage thing in this file. "Incorrect" tells a reader
they failed. "You picked A because you are thinking of X, and here is where that
model breaks" tells them what to change. Write one for every plausible wrong
answer you can name.

---

## 1. `prediction` — commit before the reveal

The strongest mechanic in the format, and the one to reach for first. Reading an
explanation produces a convincing feeling of understanding that survives right up
until you have to predict something. Forcing a commitment converts a vague sense
into a testable claim, and then breaks it.

```html
<l-quiz mode="prediction" answer="b" confidence>
  <l-prompt>What does this print?</l-prompt>
  <l-situation><pre><code>const users = [];
if (users) console.log("we have users");</code></pre></l-situation>
  <l-option value="a">nothing</l-option>
  <l-option value="b">"we have users"</l-option>
  <l-actual>we have users</l-actual>
  <l-miss for="a">You are reading `[]` as "empty, therefore falsy". Emptiness and
  truthiness are different questions in JavaScript: every object is truthy, and
  an array is an object.</l-miss>
  <l-why><p>…</p></l-why>
</l-quiz>
```

With `<l-actual>` the result is shown as a contrast — your prediction against
reality — rather than a verdict. That is the whole point: the gap is the lesson.

Omit the options for a free-text prediction; it then behaves like `explain`.

## 2. `choose` — the classic, kept honest

Sometimes multiple choice is exactly right, and the failure mode of this whole
library would be for every quiz to collapse into it. Use it when the concept
really is a discrimination between named options.

```html
<l-quiz mode="choose" answer="c">
  <l-prompt>Which of these should never be cached?</l-prompt>
  <l-option value="a">Country list</l-option>
  <l-option value="c">Auth session</l-option>
  <l-why><p>…</p></l-why>
</l-quiz>
```

Space-separate `answer` for multi-select. `value` defaults to A, B, C…

**Diagnose** is this mode with symptoms in the situation and "what would you
investigate first?" as the prompt — very effective for operational knowledge.

## 3. `spot` — find it in context

Tests recognition *in situ*, which is different from knowing a definition. A
reader can define a race condition and still not see one in forty lines of code.

```html
<l-quiz mode="spot" answer="r3">
  <l-prompt>One line makes the cache serve wrong data. Which one?</l-prompt>
  <l-situation>
    <div class="ml-spot">
<span class="ml-spot-line">async function update(id, data) {</span>
<span class="ml-spot-line">  <l-region id="r1">const p = await db.update(id, data)</l-region></span>
<span class="ml-spot-line">  <l-region id="r3">await search.reindex(p)  // may throw</l-region></span>
    </div>
  </l-situation>
  <l-why><p>…</p></l-why>
</l-quiz>
```

Regions can wrap anything — a line, a token, a node in a diagram, a cell.
Space-separate `answer` for several correct targets.

## 4. `classify` — sort the confusable

Best mechanic for pairs of concepts people conflate: sync/async, local/remote,
compile-time/runtime, state/derived state, server/client state.

Authoring is the nice part: put each item inside the bucket it belongs to and the
runtime shuffles them out into a pool. There is no separate answer key to keep in
sync.

```html
<l-quiz mode="classify">
  <l-prompt>Sort these by whether staleness is acceptable.</l-prompt>
  <l-bucket name="Safe to cache">
    <l-item>country list</l-item>
    <l-item>article body</l-item>
  </l-bucket>
  <l-bucket name="Never">
    <l-item>auth session</l-item>
  </l-bucket>
  <l-why><p>…</p></l-why>
</l-quiz>
```

The reader clicks an item, then the bucket. Works on touch and by keyboard.

## 5. `arrange` — reconstruct the sequence

Document order is the correct order; the runtime shuffles. For protocols,
pipelines, algorithms, CI/CD, request lifecycles, agent loops.

```html
<l-quiz mode="arrange">
  <l-prompt>Put a cache-aside read back in order.</l-prompt>
  <l-item>request arrives at the API</l-item>
  <l-item>look for the key in the cache</l-item>
  <l-item>on a miss, query the database</l-item>
  <l-why><p>…</p></l-why>
</l-quiz>
```

Add `low=` and `high=` and it becomes a **ranking** instead — ordering by a
property (coupling, cost, risk) rather than by time:

```html
<l-quiz mode="arrange" low="least coupled" high="most coupled">
```

## 6. `explain` — produce it, don't recognise it

Recognition is cheap and feels like knowledge. Generation is the real test.
Deliberately not graded strictly — the value is the reader writing the
explanation and then seeing which pieces they left out.

```html
<l-quiz mode="explain">
  <l-prompt>A colleague says "caching always makes things faster." Write the
  shortest reply that would change their mind.</l-prompt>
  <l-key match="miss|hit.?rate">A low hit rate means you pay the cost and get none of the benefit</l-key>
  <l-key match="stale|invalidat|wrong">Cached data goes stale — latency for correctness</l-key>
  <l-reference><p>A model answer, shown afterwards.</p></l-reference>
</l-quiz>
```

`match` is a case-insensitive regular expression. Keep them generous — you are
checking whether an idea is present, not marking spelling.

**Counterexample** is this mode with the prompt inverted: state a rule the reader
believes ("caching always helps") and ask them to find where it breaks. Excellent
for teaching the limits of a rule, which is usually the part that is missing.

**Debug** is this mode, or `spot`, with code plus observed behaviour plus expected
behaviour in the situation.

## 7. `estimate` — make quantitative intuition explicit

Engineers carry rough numeric models around and almost never test them. This
mechanic drags one into the open and puts a real value next to it.

```html
<l-quiz mode="estimate" min="0" max="200" step="1" unit=" ms"
        actual="14" tolerance="0.6" confidence>
  <l-prompt>90% hit rate. Hits cost 2 ms, misses 122 ms. Average read latency?</l-prompt>
  <l-why><p>0.9 × 2 + 0.1 × 122 = 14 ms. But one request in ten is still slow —
  averages hide tails. Watch p99, not the mean.</p></l-why>
</l-quiz>
```

`tolerance` is a fraction of `actual` (0.6 = within 60%). Be generous: you are
testing an order of magnitude, not arithmetic. Give it `<l-option>` elements
instead and it becomes bucketed multiple choice.

Good for latency, tokens, memory, cost, complexity, scale.

---

## Confidence, and why it earns its slider

Add `confidence` and the reader rates how sure they were. Four outcomes, and only
two of them are interesting:

| | correct | wrong |
|---|---|---|
| **confident** | fine | **the valuable one** |
| **unsure** | worth locking in | expected |

Confident-and-wrong means a belief the reader actively trusts and that does not
hold. That is exactly the thing an explanation exists to fix, and it is invisible
without the slider. The ending calls it out by name.

Use `confidence` on the two or three checks where a misconception is likely, not
on every quiz — asked constantly it becomes a tic and people stop reading it.

## Where a check goes

Placed directly under the section that taught it, a check asks whether the idea
is still in working memory. That is easy to pass and weak evidence. A check that
reaches back two or three sections asks whether the idea is retrievable at all,
which is the thing worth knowing.

Put most checks where they follow their teaching — the reader needs the win —
and at least one where it does not. The `l-checkpoint` is the natural place for
the reaching-back kind.

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
