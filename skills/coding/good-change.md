# Good change

Properties of a change relative to its cause. Read before proposing or writing any change, and when reviewing a fix.

- **Fix at the origin.** A fix lands where the bad state is produced, never where it is read. A guard that swallows bad input in a shared path hides the misusing caller. Ask why until the mechanism is in hand, not the symptom, then sweep the siblings for the same pattern.
- **Restructure-first.** The best output is spotting a structure that invites a class of bugs, and proposing the structure that deletes the class. The bar: name what the new structure deletes. Invalid states made unrepresentable, scattered checks collapsed, a bug class that can no longer be written. Nothing deleted means style preference, so downgrade or drop. Several bugs in one area usually share a structural cause, so report the Restructure as primary and the bugs as evidence.
- **Restructure triggers.** A lock added to fix a race. A fix that adds one more flag to a pile of booleans. A poll watching for a condition another system causes. Scattered validity checks. A new ad-hoc conditional inserted into an unrelated flow.

## Origin decides the shape

A proposal is judged by what it deletes, not just what it patches. Classify each bug's origin first, because the origin decides the fix shape.

- **Attention-miss.** A careful human would plausibly write this too: a wrong fence, a missed edge, an off-by-one. A spot fix is honest. Propose it.
- **Self-consistency bug**, the agent-typical one: an unvalidated constant, a test that mirrors the code, an invented default, evidence measuring the wrong path. The same generator will produce this class again, so the proposal must carry the guardrail that makes recurrence impossible or CI-visible: an assertion at the boundary against the delivered value, a physical-unit test, a lint. A spot fix alone leaves the class alive.
- **Design-absence bug.** A known structure prevents the class: single ownership per lifetime, an explicit state machine, a pure classifier over recomputed state. This is a Restructure rather than a Bug with a patch, and the proposal names the structure.

## Rules that sharpen the choice

- **Ownership before protocol.** Before proposing tokens, generations or flags on shared mutable state, answer why the state is shared. One owner object per lifetime, created with its scope and dying with it, taking its callbacks and buffers along, deletes the coordination protocol and every future bug in it. Strengthening a protocol without answering "why is this shared?" patches the mechanism and keeps the class.
- **Structure wins at agent economics.** Agents write and re-review code cheaply, so diff size is not a cost worth weighing. The real costs are regression risk and interface churn. When a structural fix deletes the class and a spot fix only closes the instance, recommend the structure and buy the risk down with tests. Reserve spot fixes for attention-misses.
- **Restore the invariant when it is cheap.** A benign observed instance does not close a broken invariant, because the hole that admitted it admits bugs nobody caught. When restoring the invariant is cheap, recommend it outright.
- **Lock a fix down.** A fix ships with a regression test at the correct seam, where the test exercises the real bug pattern as it occurs, and the strongest one reads red then green: falsifiers first. A temporary test that proved the fix is the candidate. When no correct seam exists, that is a finding about the architecture: record it.
- **A fix that departs from the approved shape states its measured reason.**

## A proposal is a change

Never recommend a fix you only reasoned about. A proposal is a change, so review it like one:

- Apply it, or walk it line by line at every site it touches. If you applied it, restore the workspace before the verdict.
- Check it against recorded rulings, the tests that assert today's behavior, and the logging that already reports this failure.
- State its cost from the code it touches, never from a guessed line count.
- When two fix shapes compete, patch against restructure or structure A against structure B, investigate both in the actual code: who owns the state today, what each shape changes, its cost and its risk. Then recommend one with the reasoning, or hand the owner the mapped choice per findings.md.

A fix only its author examined is unreviewed code.
