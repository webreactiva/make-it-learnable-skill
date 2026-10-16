# Drawing the thing

`Flow`, `Anatomy`, `Compare` and `StateBox` are furniture. They are
excellent when the idea really is boxes, parts, columns or fields, and they cost
you nothing to place. But a vocabulary of widgets has a gravity: every lesson
about a process comes out as the same three grey boxes on a grid, and a reader
who has seen two of these lessons can predict the third before scrolling.

A `Drawing` is the escape. Use it when the shape of the idea is not the shape of any
widget — and that is more often than the widgets make it look.

## When a drawing earns its place

Draw it when the **spatial arrangement carries meaning the layout engine cannot
express**: something moves along a path, a region fills up, two things overlap,
a queue drains, a signal decays, memory is laid out contiguously, one thing
nests inside another, a boundary is crossed.

Keep the widget when the meaning is a **list of named things**: modules and their
imports, the fields of a struct, four options across five criteria. `Flow` will
route those arrows better than you will, and it stays correct when the wording
changes.

The honest test, before you start drawing: *say out loud what the picture
shows.* If the sentence is "the parts of X" or "A calls B calls C", there is a
primitive for that. If it is "the buffer fills from the left while the reader
drains it from the right", draw it.

## One drawing, one idea

A drawing that shows the whole system is a diagram nobody reads. A drawing that
shows one thing — and then *changes* across scenes — is the entire reason this
runtime exists.

So: build the drawing to be transformed. Before drawing anything, write the beats
you need on the stage: *empty → first write → cache hit → eviction → cold again*.
Then draw the union of those states, mark the elements as named parts and
`when:` states in the blueprint — and anything that moves as one part with
`poses` and a `path`, so the scenes move it instead of swapping copies. A drawing that never changes is a
picture, and a picture belongs in the prose, not on a sticky stage.

## Draw the mechanism, not the org chart

The failure mode is drawing the *names* of things instead of their behaviour.
Three rectangles labelled `Client`, `Server`, `Database` with arrows between them
tells the reader nothing they could not have guessed from the words. Draw what
actually happens: how far the arrow travels, how long the round trip is compared
to the local read, how the queue is 4 deep and the pool is 2 wide, which byte
the pointer is sitting on.

Concretely:

- **Scale means something.** If one operation is 90× slower, the bar is 90×
  longer, not "clearly bigger". A reader who measures your drawing with their eye
  and gets the wrong ratio has been taught the wrong ratio.
- **Position means something.** Left-to-right is time, or it is dataflow — pick
  one for the whole lesson and never mix them. Up is usually the layer boundary.
- **Emptiness means something.** Space between two things is distance, latency,
  or a boundary. Do not fill it because the canvas looks bare.
- **Count what you draw.** Eight slots means eight slots. If the array has 1024
  entries, draw eight and say so; do not draw a vague blob.

## Few words, big shapes

The reader is scrolling past a sticky stage while reading prose. The drawing has
about a second to be understood.

- Labels go **inside the drawing**, next to what they name. A legend is a
  join the reader has to perform, and they will not.
- Four to seven labelled elements. Past that, split it into scenes and reveal.
- Labels big enough to read at the size the drawing actually renders, phone
  included. Anything smaller is decoration you should delete.
- No sentences in the drawing. The sentences are already right there in the
  prose, in a font that reflows.

This is not the same as talking to a five-year-old. The audience is an adult who
knows other things and does not yet know this thing. Big shapes and few words are
about the *channel* — the picture does the explaining and the prose only points
at it — not about dumbing the content down. The words stay exact and few; the
drawing stays big and legible.

## Drawing a sequence of panels

`Panels` puts the drawing in charge for a stretch of the lesson. Four rules
make that work, and they are all observable in explainers that succeed at it.

**The title is a sentence, not a topic.** "Ahora sois mil." — not "Concurrencia".
A topic label makes the reader work out what the beat is even claiming; a
sentence hands them the claim and lets the drawing be the evidence for it.

**Keep the set.** Whatever recurs — the reader, the server, the prompt line, the
queue — keeps the same shape, in the same place, in every panel it appears in.
The reader then recognises the scenery and only processes what changed. This is
the single rule that separates a coherent sequence from five unrelated pictures,
and it is what stops the topology drifting between beats. If the position of a
thing has to move, that move is the point of the panel — say so.

**Open the gap before you close it.** The strongest pair in the format: one
panel poses the question *in the drawing* — a slot with a `?` in it, a value
nobody has filled — and a later panel fills exactly that slot with the answer,
highlighted. That is expectation-then-reality drawn instead of asked, and it
does the same work as a `prediction` check for a reader who has not committed to
anything yet. Use both: the panels build the model, the checks test it.

**End on a recap panel.** One drawing that lays the whole sequence out at once —
and label its parts with *the same words* the titles used. Six labels the reader
has already read twice is a retrieval hook that costs one drawing.

What a panel sequence cannot do is verify anything. A page of drawings cannot
tell a reader who understood from a reader who scrolled, and it will happily
assert things it never supports — a diagram of six equidistant steps teaches
that the six steps cost the same whether or not that is true, and the claim is
in the coordinates where no reviewer will look for it. Panels earn their place
in a lesson precisely because a check comes afterwards.

## Colour in a drawing

A drawing uses the same colour meanings as the rest of the page (`runtime.md` →
*Look and feel*), in both themes. Colour in a drawing is a signal: the right and
wrong meanings say *this succeeded / this failed*, and the thing under discussion
stands apart from the context. How it looks is yours.

## Accessibility and the file

Every drawing is exposed to assistive tech as a single image whose name is one
sentence saying what it shows — the same one you said out loud in the test
above. It scales from its coordinate box, with no fixed pixel size. No external
images, no fonts, no embedded foreign documents: the lesson is one file that has
to work from a USB stick in ten years.

## The test that catches the generic drawing

Cover the labels. If the drawing could belong to any other lesson on the same
*kind* of subject, you have drawn a widget by hand and paid the drawing price for
nothing. Every lesson should have at least one drawing that only this subject
could have produced.
