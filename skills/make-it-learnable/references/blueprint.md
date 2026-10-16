# The lesson blueprint

The blueprint is the contract between deciding and building. You write it after
the spine (SKILL.md, step 3) and before any code: it names every component the
lesson uses, in order, with every input from `components.md`, `checks.md` and
`runtime.md` filled in. Then you build the page from it, your own way.

It exists for three reasons:

1. **Decisions before code.** Every primitive choice, every miss, every why is
   on the page where it is cheap to change and easy to show the user.
2. **A checkable surface.** Cross-references that fail silently in a browser — a
   focus naming a part that does not exist, a check with no answer — are visible
   in the blueprint and must be fixed there (step 5 in SKILL.md).
3. **A faithful build.** Each block maps to exactly one contract. When you build,
   you implement contracts, not guesses.

Keep the blueprint as a working file beside the lesson (`NAME.blueprint.yaml`).
It is not shipped inside the page.

---

## Format

YAML. Prose fields accept light inline markup: `**bold**`, `*emphasis*` and
`` `code` ``; render it as the corresponding emphasis, never as raw text.
Multi-paragraph prose uses a block scalar (`|`) with blank lines between
paragraphs.

### Top level

```yaml
lesson:
  title: …            # Hero title and document title
  eyebrow: …          # "Subject · N min"
  lede: …             # the promised capability
  description: …      # one sentence, for the document description
  lang: …            # resolved per SKILL.md; needs a complete block in strings.yaml
  sources:            # at least one; "Label | https://url" or a plain label
    - …
  finish:
    title: …
    next: |           # where to go next and what was left out (required)
      …
sections:
  - …                 # in reading order
```

### A section

```yaml
- id: the-cost                 # unique, URL-safe
  title: Every read costs a round trip
  goal: See where the time in a request actually goes
  eyebrow: The problem         # optional
  body:                        # ordered blocks
    - prose: |
        …
    - ComponentName: { …inputs… }
```

A block is either `prose:` or exactly one component from the catalogue, keyed by
its name (`Story`, `Panels`, `Stage`, `Split`, `Stepper`, `Branch`, `Reveal`,
`Layers`, `Anatomy`, `Compare`, `Transform`, `Flow`, `Trace`, `StateBox`,
`WhatIf`, `Sandbox`, `Lab`, `Check`, `Contrast`, `Checkpoint`, `Code`, `Stack`,
`Picture`, `Analogy`).
Inputs use the names in the contracts. Containers (`Split`, `Stage`, `Stack`,
`Story`, `Panels`, `Branch` paths, `Stepper` steps) hold nested blocks.

### Field names, per component

Inputs keep the names in the contracts. Where a component holds a list or nested
blocks, these are the keys. `blocks` means a list of blocks (prose or
components); `fx` means the effect keys (see *Effects*).

| component | shape |
|---|---|
| `Story` | `stage:` (a Stage), `scene_height:` optional, `scenes:` list of { `name` (optional), `text`, …fx } |
| `Panels` | `numbered:`, `panels:` list of { `title`, `caption`, `Drawing:` or `BigNumber: { value, unit }` } |
| `Picture` | `title`, `caption`, `Drawing:` |
| `Analogy` | `familiar:` (a Drawing), `concept:` (a Drawing), `pairs:` list of { `familiar`, `concept`, `label` }, `breaks` |
| `Stage` | `id`, `label`, `sticky`, `show:` blocks |
| `Split` | `ratio`, `sticky`, `left:` blocks, `right:` blocks |
| `Stack` | `density`, `body:` blocks |
| `Stepper` | `stage`, `start`, `steps:` list of { `body:` blocks, …fx } |
| `Branch` | `question`, `rejoin`, `paths:` list of { `label`, `body:` blocks } |
| `Focus` | `target:` [parts], `stage` |
| `Reveal` | on a stage: inside a scene/step as `reveal:`; standalone: `label`, `body:` blocks |
| `Layers` | `stage`, `layers:` [names], `default:` [names], `labels:` { name: display label } |
| `Anatomy` | `hint`, `parts:` list of { `label`, `note` } |
| `Compare` | `label`, `columns:` [names], `criteria:` { name: [one cell per column] } |
| `Transform` | `phases:` list of { `name`, `body` } |
| `Flow` | `cols`, `nodes:` list of { `id`, `label`, `sub`, `row`, `col`, part flags }, `edges:` list of { `from`, `to`, `label`, `layer` } |
| `Trace` | `stage`, `start`, `steps:` list of { `label`, `detail`, …fx } |
| `StateBox` | `name`, `fields:` { key: initial value } |
| `Drawing` | `label`, `box`, `elements:` list of { `part`, `is`, `colour` (a meaning), `tint`, `poses:` { name: where/how }, `path`, part flags } |
| `WhatIf` | `inline:` text with `[name]` slots (inline form only), `vars:` { name: inputs }, `outs:` { name: inputs } |
| `Sandbox` | `code`, `run_label` |
| `Lab` | `runs:` list of { `label`, `code` } |
| `Code` | `lang`, `code` |
| `Contrast` | `expected`, `actual`, `why`, `expected_label`, `actual_label` |
| `Checkpoint` | `title`, `can:` [statements] |
| `Check` | `mode`, `id`, `prompt`, `situation:` { `text` and/or `code` }, `confidence`, `why`, plus per mode: `options:` { value: text } and `answer` (choose, prediction, estimate-with-options); `actual`; `miss:` { value or region: text }; `buckets:` { name: [items] } (classify); `items:` [in correct order], `low`, `high` (arrange); `keys:` list of { `match`, `text` }, `reference`, `placeholder` (explain); `min`, `max`, `step`, `unit`, `actual`, `tolerance` (estimate) |

### Stage parts

A stage declares the parts that effects may name. Flow nodes are parts by id;
drawing elements are parts by `part:`.

```yaml
Stage:
  id: arch
  label: One product page request
  sticky: true
  show:
    - Flow: { … }       # or Drawing, StateBox, Trace…
```

Part flags, on any node or drawing element: `later: true`, `when: STATE`,
`layer: NAME`.

### Drawings

Describe the drawing well enough that its layout follows from the description —
coordinates are yours to choose when you build.

```yaml
Drawing:
  label: A request travelling through the proxy     # its accessible name
  box: 640x260                                      # coordinate box / aspect
  elements:
    - { part: wire,   is: "horizontal line across the middle", colour: context }
    - { part: proxy,  is: "box at the centre labelled 'proxy'", colour: under discussion, tint: 0.14 }
    - { part: packet, is: "small dot on the left of the wire", colour: under discussion, later: true }
    - { part: buffer, is: "stack of three slots inside the proxy", when: buffered }
```

`colour` names a **meaning** from `runtime.md` → *Look and feel* (the thing under
discussion, context, right, wrong…), never a colour. `tint` is the fill opacity.

A part that **moves** across scenes is one element with `poses` (the first is
where it starts) and, if it follows a track, a `path` naming another part. Scenes
move it with `pose:`; it travels between poses instead of jumping.

```yaml
Drawing:
  label: A packet travelling from the browser through the proxy to the server
  box: 960x300
  elements:
    - { part: wire,   is: "long horizontal line across the drawing", colour: context }
    - { part: proxy,  is: "box in the middle of the wire labelled 'proxy'", colour: context }
    - part: packet
      is: "small envelope sitting on the wire"
      colour: under discussion
      path: wire
      poses: { sent: "left end, at the browser", held: "inside the proxy", delivered: "right end, at the server" }

# and in the story:
scenes:
  - { text: "The browser sends the request.", pose: { packet: sent }, focus: [packet] }
  - { text: "The proxy holds it until the whole body has arrived.", pose: { packet: held }, focus: [proxy] }
```

### Effects

Scenes, steps and trace steps carry effects under the names in the protocol:
`focus`, `reveal`, `state`, `pose`, `step`, `layers`, `fields`, and `stage` when it is
not the nearest one.

### Inline reactive numbers

In an inline `WhatIf`, write the sentence with `[name]` where a variable or
output sits:

```yaml
WhatIf:
  inline: |
    At a hit rate of [hit] the average read costs [avg].
  vars:
    hit: { min: 0, max: 100, value: 80, unit: "%", label: hit rate }
  outs:
    avg: { expr: "hit/100*2 + (1-hit/100)*90", unit: ms }
```

### Spot regions

In a `spot` situation, mark each clickable region as `[[id: text]]`:

```yaml
situation:
  code: |
    async function update(id, data) {
      [[r1: const p = await db.update(id, data)]]
      [[r3: await search.reindex(p)  // may throw]]
    }
```

---

## What to check in the blueprint (before building)

Treat any failure as a broken lesson, not a style note.

- Every `focus`, `reveal` and `Focus.target` names a part **in the stage that
  effect resolves to** (its `stage`, else the nearest stage in the same section
  or story). Every `stage:` names a stage that exists. Part names are unique per
  stage; ids are unique per lesson.
- Every `Layers` name exists on a part in its stage.
- Every `pose:` names a part with `poses` in its stage, and one of those poses;
  every `path` names a part of the same drawing.
- Every `Story`: each scene changes the stage (an effect other than focus, or a
  focus different from the previous scene's); a thing that is in a different
  place in different scenes is **one** part with poses — not copies toggled by
  `when`, and not copies drawn at every position with the focus hopping
  between them.
- Every Flow edge connects two node ids of the same Flow.
- Every WhatIf output has an `expr` using only its own declared variables and the
  allowed helpers; inline variables have a `value`; there is at least one var and
  one out.
- Every check: has a prompt; has a why (or, for `explain`, a reference); its
  `answer` matches option values (choose/prediction with options) or region ids
  (spot); every wrong option has a miss and every miss names an option;
  `prediction` has an `actual`; `classify` has 2+ named buckets with items;
  `arrange` has 3+ items and both or neither of `low`/`high`; slider `estimate`
  has `min`, `max`, `actual`; `explain` has key ideas or a reference.
- `Stepper` 2+ steps; `Anatomy` 2+ parts, each with a note; `Compare` 2+ columns
  and one cell per column on every criterion; `Branch` 2+ labelled paths.
- `Panels`: 3+ panels; every title a sentence; every panel has a Drawing or a
  BigNumber; captions ≤ 25 words.
- `Picture`: a Drawing and a caption ≤ 15 words. `Analogy`: both drawings, 2+
  pairs, each pair naming a part that exists in its drawing.
- Every section's first block is a `Picture`, a `Story` or an `Analogy` (a
  section that opens with a check may put the drawing right after it); the
  lesson has at least one `Analogy`; anything that goes somewhere travels in a
  `Story` with `pose`.
- **Word budget**: no prose block over ~60 words; more pictures (Picture,
  Panels, Story, Analogy, drawings on stages) than prose blocks. A section made
  only of prose needs a reason.
- Every section has a goal; at least one check, one `Checkpoint`, and a
  `finish.next`; at least one source.

---

## Worked example

A complete 12-minute lesson. Read it when the requested lesson is substantial or
you need a composition example; skip it for small edits.

```yaml
lesson:
  title: Why a cache sits in front of your database
  eyebrow: Backend fundamentals · 12 min
  lede: >
    Not "because it's faster". By the end you should be able to say what it is
    faster *than*, when it is slower, and what breaks when it is wrong.
  description: Cache-aside from the request up, with the miss path and its bugs.
  lang: en
  sources:
    - "Redis documentation: caching patterns | https://redis.io/docs/latest/develop/use/patterns/"
  finish:
    title: That's caching, honestly
    next: >
      The natural next step is **invalidation strategies** — the half of the
      problem this lesson deliberately kept at arm's length. After that, cache
      stampedes and read-through vs cache-aside.

sections:
  - id: the-cost
    title: Every read costs a round trip
    goal: See where the time in a request actually goes
    eyebrow: The problem
    body:
      - Story:
          stage:
            id: arch
            label: One product page request
            show:
              - Flow:
                  cols: 3
                  nodes:
                    - { id: browser, label: Browser, sub: the reader }
                    - { id: api, label: API, sub: your server }
                    - { id: db, label: Database, sub: disk + query planner }
                    - { id: redis, label: Redis, sub: in memory, later: true, row: 2, col: 2 }
                  edges:
                    - { from: browser, to: api, label: "GET /product/42" }
                    - { from: api, to: db, label: "SELECT …" }
                    - { from: api, to: redis, label: "GET product:42" }
                    - { from: redis, to: db, label: miss }
          scenes:
            - focus: [browser]
              text: >
                Someone opens a product page. From here everything downstream
                is invisible to them — they only experience the total.
            - focus: [api]
              text: >
                Your API receives it. Parsing the request, checking auth,
                building the response: fast. Single-digit milliseconds. This is
                almost never the problem.
            - focus: [db]
              text: |
                Then it asks the database. The query itself may be quick, but
                the round trip is not free: connection, network hop, query
                planning, reading pages that may not be in memory.

                Do that on every request, for every visitor, for a row that
                changed last Tuesday.

  - id: predict
    title: Before we fix it
    goal: Commit to a number before seeing the real one
    body:
      - Check:
          mode: prediction
          confidence: true
          prompt: >
            An identical product page is requested 1,000 times in a minute and
            nothing about it changes. How many times does the database run that
            same query?
          options:
            a: Once — databases cache repeated queries
            b: 1,000 times
            c: Roughly 10 — the connection pool batches them
          answer: b
          actual: 1,000 times.
          miss:
            a: >
              Databases *do* keep pages in memory, and the query will get faster
              after the first run. But "faster query" is not "no query": you
              still pay the connection, the network hop, the planner and the
              serialisation, 1,000 times.
            c: >
              Connection pools reuse connections; they do not merge queries.
              Each request still issues its own.
          why: >
            The database has no idea that the answer it just computed is about
            to be asked for again. That is the gap a cache fills — not speed,
            **repetition**.

  - id: the-fix
    title: Put the answer somewhere closer
    goal: Understand what changes when Redis is added
    body:
      - Analogy:
          familiar:
            Drawing:
              label: A desk with a sticky note beside a far-away filing cabinet
              box: 640x240
              elements:
                - { part: you,     is: "person at a desk on the left", colour: context }
                - { part: note,    is: "sticky note on the desk, within arm's reach", colour: under discussion }
                - { part: cabinet, is: "tall filing cabinet far to the right, a long dashed walk to it", colour: context }
          concept:
            Drawing:
              label: The app with Redis next to it and the database far away
              box: 640x240
              elements:
                - { part: app,   is: "box on the left labelled 'app'", colour: context }
                - { part: redis, is: "small box right beside the app labelled 'Redis'", colour: under discussion }
                - { part: db,    is: "large cylinder far to the right labelled 'database', a long dashed line to it", colour: context }
          pairs:
            - { familiar: note,    concept: redis, label: the answer you already looked up }
            - { familiar: cabinet, concept: db,    label: where the answer really lives }
          breaks: >
            A sticky note never goes stale on its own; a cached product does the
            moment someone edits it in the database.
      - WhatIf:
          inline: >
            If a product page takes [db] to build from the database and [cache]
            from Redis, then at a hit rate of [hit] the average read costs
            [avg] — and you have taken [load] of the traffic off the database
            entirely.
          vars:
            db: { min: 10, max: 300, value: 90, unit: ms, label: database latency }
            cache: { min: 1, max: 20, value: 2, unit: ms, label: cache latency }
            hit: { min: 0, max: 100, value: 80, unit: "%", label: hit rate }
          outs:
            avg: { expr: "hit/100*cache + (1-hit/100)*db", unit: ms }
            load: { expr: "hit", unit: "%" }
      - prose: >
          Drag the hit rate down to 20% and watch the average barely move. That
          is the thing people get wrong about caching: a cache with a poor hit
          rate is not a small win, it is nearly no win at all — while still
          costing you a whole new source of stale data.

  - id: miss
    title: The path nobody draws
    goal: Follow a cache miss step by step
    body:
      - Split:
          sticky: true
          left:
            - prose: >
                A hit is boring. Every interesting bug in a caching layer lives
                on the **miss** path, because that is where two systems have to
                agree about what is true.
            - Trace:
                steps:
                  - { label: request received, detail: "GET /product/42 arrives. Nothing has been read yet." }
                  - { label: ask Redis, detail: "GET product:42 → (nil). This is the miss. Costs ~1ms to find out." }
                  - { label: fall through to the database, detail: "SELECT * FROM products WHERE id = 42 → 1 row, ~90ms." }
                  - { label: write it back with a TTL, detail: "SETEX product:42 300 {...}. The TTL is the decision that matters: it is how long you are willing to serve a wrong answer." }
                  - { label: respond, detail: "200 OK. Total ~92ms — slower than no cache at all for this one request." }
            - prose: >
                Note step 5: on a miss the cache made the request *slower*.
                Caching is a bet that misses are rare.
          right:
            - Stage:
                label: Where the time goes
                show:
                  - StateBox:
                      name: request timing
                      fields:
                        cache lookup: 1 ms
                        db query: 90 ms
                        cache write: 1 ms
                        total: 92 ms

  - id: whats-cacheable
    title: What can you actually cache?
    goal: Separate data by how much staleness it tolerates
    body:
      - Check:
          mode: classify
          prompt: Sort these by whether a few minutes of staleness would be acceptable.
          buckets:
            Safe to cache: [product description, country list, public article body]
            Cache carefully: [stock count, current price]
            Do not cache: [shopping basket, auth session]
          why: >
            The question is never "is this slow to fetch". It is **"what happens
            if I serve a version of this from five minutes ago"**. A stale
            country list is nothing. A stale stock count sells you something
            that does not exist. A stale basket belongs to someone else.

  - id: the-bug
    title: A cache that quietly lies
    goal: Recognise a stale-write bug in real code
    body:
      - Check:
          mode: spot
          confidence: true
          prompt: >
            This updates a product. One line makes the cache serve wrong data
            for the next five minutes. Which one?
          situation:
            code: |
              async function updateProduct(id, data) {
                [[r1: const product = await db.products.update(id, data)]]
                [[r2: await redis.setex(`product:${id}`, 300, JSON.stringify(product))]]
                [[r3: await search.reindex(product)   // may throw]]
                return product
              }
          answer: r3
          why: |
            Nothing is wrong with the write order — the database changes first,
            then the cache. The problem is that `reindex` can throw *after* both
            have been written, so the caller sees a failure and retries or
            reports an error, while the cache is already holding the new value
            for 300 seconds.

            The fix is not reordering. It is deciding whether the cache write
            belongs inside the same failure boundary as everything else —
            usually by invalidating rather than writing through:
            `await redis.del(`product:${id}`)`.

  - id: order
    title: The read path, in order
    goal: Reconstruct the cache-aside sequence yourself
    body:
      - Check:
          mode: arrange
          prompt: Put a cache-aside read back in order.
          items:
            - request arrives at the API
            - look for the key in the cache
            - on a miss, query the database
            - write the result back with a TTL
            - return the response
          why: >
            The name says it: the cache sits *aside* the database, and the
            application is what knows about both. Nothing here happens
            automatically — which is why invalidation is your problem and not
            Redis's.

  - id: tradeoff
    title: What a cache costs
    goal: Weigh the cache against its real price
    body:
      - Compare:
          columns: [Straight to the database, Cache in front]
          criteria:
            Typical read: ["~90 ms, every time", "~2 ms on a hit, ~92 ms on a miss"]
            Database load: [1 query per request, 1 query per miss]
            Correctness: [Always current, "Current within the TTL, at best"]
            Things that can break: [The database, "The database, the cache, and the agreement between them"]
            Cost of being wrong: [Slow, "Wrong, silently, for the length of the TTL"]
      - prose: >
          Move the sliders until the cache stops being worth it. It happens
          sooner than most people expect.
      - WhatIf:
          vars:
            hit: { type: range, min: 0, max: 100, value: 85, step: 5, unit: "%", label: Hit rate }
            dbms: { type: range, min: 5, max: 300, value: 90, step: 5, unit: ms, label: Database latency }
            ttl: { type: range, min: 1, max: 600, value: 300, step: 1, unit: s, label: TTL }
          outs:
            avg: { label: Average read, expr: "hit/100*2 + (1-hit/100)*(dbms+3)", unit: " ms", good: low, threshold: 30 }
            saved: { label: Database load removed, expr: "hit", unit: " %", good: high, threshold: 70 }
            stale: { label: Worst-case staleness, expr: "ttl", unit: " s", good: low, threshold: 120 }

  - id: estimate
    title: A number to commit to
    goal: Make your quantitative intuition explicit
    body:
      - Check:
          mode: estimate
          confidence: true
          prompt: >
            A cache is doing its job at a 90% hit rate. Hits cost 2 ms, misses
            cost 122 ms. What is the *average* read latency?
          min: 0
          max: 200
          step: 1
          unit: " ms"
          actual: 14
          tolerance: 0.6
          why: >
            0.9 × 2 + 0.1 × 122 = **14 ms**. One request in ten is still slow —
            averages hide tails. Watch p99, not the average.

  - id: explain
    title: Say it in your own words
    goal: Produce the explanation, not recognise it
    body:
      - Check:
          mode: explain
          prompt: >
            A colleague says: "we should cache everything, caching always makes
            things faster." Write the shortest reply that would change their mind.
          keys:
            - { match: "miss|hit rate|hit.?ratio", text: A low hit rate means you pay the cost and get almost none of the benefit }
            - { match: "stale|invalidat|out.?of.?date|wrong", text: Cached data goes stale — you trade correctness for latency }
            - { match: "slower|overhead|extra|adds", text: On a miss the request is slower than it would have been }
            - { match: "complex|another|two systems|fail", text: You add a second system that can fail or disagree with the first }
          reference: >
            "Caching only helps when the same answer is asked for repeatedly. If
            the hit rate is low, every request pays the lookup and still goes to
            the database — you've made it slower and added a second system that
            can disagree with the first. The real question isn't speed, it's how
            long you're willing to serve an answer that's out of date."

  - id: depth
    title: Go deeper where you need it
    goal: Choose the angle that matters for your work
    body:
      - Branch:
          question: Which of these is actually your problem right now?
          rejoin: Either way, the checkpoint below is the same.
          paths:
            - label: My data goes stale
              body:
                - prose: >
                    **Invalidation.** **TTL** accepts staleness up to a fixed
                    window: simple, and wrong for a bounded time. **Explicit
                    invalidation** deletes the key whenever the row changes:
                    correct, until one write path forgets.
            - label: My hit rate is bad
              body:
                - prose: >
                    **Key design.** Keys that include a user id, a timestamp or
                    a full query string make nearly every request unique. Cache
                    the shared part and compose the personal part on top.
            - label: It falls over under load
              body:
                - prose: >
                    **Stampede.** When a popular key expires, every in-flight
                    request misses at once. Fix it with a refill lock or by
                    refreshing slightly before expiry.

  - id: consolidate
    goal: Confirm the block before moving on
    body:
      - Checkpoint:
          title: Before you move on, you should be able to explain
          can:
            - What a cache is faster *than*, and why the comparison is about repetition rather than speed
            - Why a low hit rate makes a cache nearly worthless rather than slightly useful
            - "What a TTL really is: how long you accept serving a wrong answer"
            - Why a cache miss is slower than having no cache
            - Which of your own data would be dangerous to cache, and why
```
