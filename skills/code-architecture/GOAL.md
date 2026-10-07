# Goal

Read before discussing or changing this skill.

## Why

Agents reviewing a complex subsystem find local bugs and miss the structure that made the bug possible. Given the code, they follow the code: they spot the microphone left open at shutdown and never ask why an open microphone can outlive its owner at all. Systems built on external SDKs make this worse. The SDK has its own threads, error codes, completion rules and lifecycle, the game has its own, and the bugs live where the two sets of constraints overlap without anyone having written the overlap down.

This explicitly invoked skill separates the work so that one stage gathers the constraints, one stage designs from those constraints without the code, and one stage compares that design to the code. The question it exists to answer is: which classes of bug does this design permit that a different structure would make impossible to write?

Code written by agents is cheap to rewrite. The skill treats the current code as one candidate, not the baseline. Run it after a working implementation exists, because a design produced from requirements alone misses the tradeoffs the first implementation exposed.

## Pipeline

1. **Extract.** Read the code and write a code-free constraint model whose rows cite a pinned revision and record how each fact is enforced today. extract.md defines the sections. The model ends with the collapses and overlaps: the combinations the facts permit that a lens says should be impossible.
2. **Design from zero.** A fresh agent receives the model and the goals, not the source, and produces the structure that makes each illegal combination unrepresentable or checked at one gate.
3. **Compare.** Fresh agents receive the ideal and the model and list each divergence with the bug class it permits, any instance in the evidence, and whether it is a justified tradeoff or a finding.
4. **Synthesize.** One agent merges findings by mechanism and writes an implementation handoff per finding.

## Values

- **Make the bug class unrepresentable.** The remedy of first resort is the structure under which the bug cannot be written: a state owner through which every action passes, a type that excludes the illegal combination, an ownership form that releases on every exit, a correlation key checked where it is consumed. A local fix is a stopgap and is labeled as one. "Smallest change" means the smallest migration to that structure, not the smallest patch.
- **Express the constraint in code.** If a constraint can be a type, a visibility, an ownership form, a pure getter or a single gate, it is one of those, not a comment or a convention. The lens that cannot name a code expression is a readability lens, kept separately and pruned by record.
- **A literal is a decision.** A human writing a sample rate asks whether every device has that rate; an agent generating a working version writes 48 kHz, builds the tests around it, and ships code that has never seen 44.1 kHz. The constants lens asks that question explicitly for every literal in core logic: fixed by which contract, or read from where.
- **Lifetime is decided, not hedged.** Where ownership is knowable, one owner holds it and release follows every exit path. Where it is not, a region bounds it: an arena, a per-frame pool, a scope. Shared ownership everywhere is the sign that nobody decided, and it costs the performance a game cannot spare.
- **Design without the code.** The design stage sees constraints, not symbols. An agent that reads the implementation reproduces it. The compare stage brings the code back.
- **Facts survive handoff.** Each consequential claim is tied to a revision. Source behavior, provider guarantees, measurements and unknowns stay distinguishable. A timeout does not prove cancellation; an asynchronous completion does not prove a nonblocking call; a reset helper does not prove every completion reaches it.
- **Separate attention by stage and by section.** The extractor writes sections a focused comparer can read alone. Comparers do not see each other or the design agent's reasoning. One synthesis merges.
- **Spend work once at its owner.** Extraction establishes facts; later stages trust the model and return a focused question only when a material gap changes the judgment. No stage re-walks the source to certify another stage's work.
- **Every finding names its lens.** The lens that produced a finding is recorded with it, so lenses that never produce a confirmed finding, or that invent findings on sound code, can be removed. The lens list is provisional and shrinks by evidence.
- **The ideal is bounded by the unknown.** An external SDK can be wrong in ways no model captures. The design states its premises about external behavior and what stays a runtime check because of them. No report certifies the architecture finished.
- **Bounded coverage, explicit gaps.** Model the requested subsystem and the neighboring contracts needed to understand it. Bound the subsystem by the producers of the requested outcome, not by where a symptom appeared. An uninspected area is a named gap, not a clean result.

## Maintenance

Test instructions in a fresh agent context. Preserve the prompt, exact skill version, output and observed miss. Use a different fixture to check that a repair generalizes. Stop a live trial when a meaningful instruction failure is established, preserve its partial work, and repair the skill before continuing. Trial fixtures ship under `evals/fixtures/` so a case reruns against the same source and results compare across skill versions. A lens earns its place by the record in `evals/lens-ledger.md`, which defines how a run is scored. Project edits and runtime experiments need their own task authority.
