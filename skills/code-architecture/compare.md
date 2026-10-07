# Compare and synthesize

If the target moves to a new revision before compare, the coordinator re-checks the model rows whose sources changed and records the new revision in the orientation.

## Comparers

Unless the user selects another arrangement, run one whole-model comparer and one focused comparer per section group that has a couple row or a design encoding touching it: states and gates; lifetimes and interrupting events; identities; failures; handoffs and time; external contracts and wrappers; diagnostics when selected. Merge two groups into one comparer when neither has a couple row of its own.

Every comparer receives the path to the full model, the design, the goals and rulings, the project's review instructions, [lenses.md](lenses.md) and this contract. The whole-model comparer reads the whole model. A focused comparer reads the orientation, its group's sections and the collapses and overlaps, and looks up any other row an encoding or divergence cites; it does not read the whole model. A focused comparer's assignment is its section group; it writes full rows for those sections and gives a mechanism whose home is another group one line naming it and the group, so synthesis merges once. No comparer receives peer results, the design agent's reasoning or a prior verdict. If a slot limit forces batches, record it. Do not reuse one comparer for a requested set of independent comparers without disclosing the reduced independence.

**Trust the model.** Open retained project source or send a focused question back to extraction only when a material missing fact or contradiction changes a judgment. Record the gap and its answer. Version-matched provider documentation and the provider implementation the build selects are not project source. Read them when an encoding rests on provider behavior the model does not record. The external contracts and wrappers comparer owns those reads, or the whole-model comparer when that group does not run; another comparer gives such an encoding one line naming the provider claim and that group, so each provider fact is read once. If the model is wrong or insufficient, name that extraction failure rather than rebuilding it in every comparer.

Before judging the code against an encoding, judge the encoding. It is a **design defect** when anything it states or implies, including a numbered premise, is refuted by the model, by the provider implementation the build selects, or by version-matched provider documentation; when it matches a shape in [Checking a design](lenses.md#checking-a-design); or when another part of the design already makes it unnecessary. The current code avoiding the bug does not pass the encoding; judge the encoding as written.

Each comparer's output opens with a **Design check**: one line per encoding in its sections. A line is "passes", or a design-defect row: the encoding, the shape or the model row, provider code or provider document that refutes it, and the lens slug. The code is not judged against a defective encoding.

Each comparer then returns one line per remaining design invariant in its sections: a divergence row, "matches", or "not checkable from the model" with the missing fact named. A divergence row has:

- **Divergence:** the design's encoding, the model's recorded enforcement, and the lens slug.
- **Bug class permitted:** what can be written under the current form that the design forbids, as a concrete sequence: this state, this action, this event, this outcome.
- **Instance:** a model row showing the bug class realized, or "no instance in evidence".
- **Disposition:** one of five. Finding: the bug class is reachable on the model's facts, with or without an instance. Conditional finding: reachable only if a named unresolved fact goes one way. Justified tradeoff: the ruling or constraint that justifies it. Not a finding: the code differs from the design but the model shows the combination excluded another way. Evidence gap: a missing fact decides the call.
- **Confidence and limits:** what would change the disposition.

For the diagnostics lens, follow the compare cues in [logging.md](logging.md).

## Revise once

If any comparer returned a design defect that changes an encoding, a fresh designer revises the affected encodings once, with the defect rows added. A fresh comparer for each affected section group then runs the design check and divergence rows on the revised encodings only.

## Synthesize once

A fresh synthesizer receives the model, the revised design, the goals and every divergence list. A remedy the synthesizer introduces that no comparer saw gets the same design check before it enters a handoff. The synthesis opens with a **Summary** of at most 500 words: the target structure in one paragraph, the handoffs that change structure rather than patch a line, and the decisions. Everything else follows it as reference. Merge rows by mechanism and affected contract, not by lens or title. Keep distinct facets and their source, including a cross-group divergence only the whole-model comparer saw. Resolve disagreements with the model or one bounded lookup; agreement between comparers proves nothing by itself.

For each retained finding, write one handoff, ordered by the consequence of the bug class:

1. **Outcome and cause.** The concrete sequence that breaks, and whether the cause is a missing encoding, a missing gate, or a local omission inside a sound structure.
2. **Remedy.** The structure that removes the bug class, named by its code form and owner, and the smallest migration that reaches it. If the user defers the migration, the local stopgap, labeled as a stopgap. Name the alternative rejected and why. If the choice depends on missing evidence or a user tradeoff, state that dependency instead of listing unranked options.
3. **Patch boundary.** Producers, wrappers, consumers and the initial, refresh, replacement and teardown siblings the migration touches. Preserve behavior outside the correction.
4. **Verification.** A check that fails under the current form and passes under the remedy: a type that no longer compiles the bad sequence, an assertion at the gate, or a test at the real wiring that runs the interrupting event. Name existing seams.
5. **Readiness.** Ready to implement, a named decision or fact outstanding, or no change justified. A direction is not a patch; a proposed test is not evidence.
6. **Lens.** The slug.

End with a **Ledger** table in the columns of `evals/lens-ledger.md`, with Result blank until the user confirms or refutes each finding. Link the model and design for detail.

## Authorized implementation

Compare alone does not authorize project edits. When the user also asks for fixes, take the handoff into the project's coding workflow: check the current baseline, make recoverable scoped changes, run the discriminating checks, report what passed. Preserve open evidence gaps rather than closing every row speculatively. Do not repeat the compare, or request approval already supplied, merely to start implementation.
