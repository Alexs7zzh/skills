# Good change

Design and boundary judgment for implementation, review and diagnosis. These principles apply at every level; they do not require an investigation record, independent reviewer, or team. SKILL.md owns read selection, authority and the selected level. For deep work, investigation.md owns the method.

## Establish the outcome

For a feature, identify the intended experience and the scenarios that distinguish success from a merely completed implementation. Separate user rulings from implementation choices. For a defect, identify the bad state and the mechanism that produces it. For a maintenance change, name the concrete task or failure boundary made easier to reason about. Do not invent a bug to justify a requested feature.

Walk the relevant callers, owners and failure paths before selecting the boundary. Check existing docs, tests, and retained captures before calling a behavior blocking or untested; incidental coverage counts only when the artifact shows the relevant state. Those artifacts are evidence to check against the goal, not reasons to preserve accidental behavior. Keep an acceptance explanation proportional to the choice the user needs to understand.

## Name the fact before storing it

Before the first edit, and in a proposal or review of a change, sweep what the change adds to an existing owner: a stored field, flag, count, map entry, or a public entry point that writes one. An empty sweep needs no note. Otherwise write a structure note in the response, before the plan, one row per addition:

- **Fact.** The runtime question the stored value answers, in one sentence, and the consumer that reads the answer. A source or a reason is not the fact. "The position the editor sent" and "kept loaded by the toolbar" name who supplied an input; the fact is "where this item currently is" or "whether anything still needs it".
- **Writers.** Every site that will write or rewrite the value after the change, including existing refreshes that rebuild the containing entry from another source. Two writers deriving the same value from different sources is the defect to design out: one owner writes it, the others preserve it or ask it. Last writer wins is not a resolution; a refresh that re-derives the value from its own source overwrites what the other writer set.
- **Lifetimes.** The lifetime of the storage against the lifetime of each party that sets it. Name the party that uses the value, not the container it was found in; an operation outlives the list it started from. A party that can outlive its storage, such as a request still waiting while the record it was keyed to is removed and recreated, needs its own handle, and release takes the handle, not the key. A key, or a count keyed by it, frees whoever holds that key now and cannot tell a stale release from a live one.
- **Cardinality.** Whether more than one instance of a writer can be live at once. A kind, reason, or category is not an instance; a flag per kind cannot count instances.
- **Verdict.** Either "the existing structure holds this fact" with the owner named, or the API change to make first, listed as the first step of the plan, before the feature code.

## Choose the boundary

- **Fix the cause where it can be owned.** When a failure reaches a guard or log, trace its input through the callers to the producer before choosing the fix. Distinguish a failed retrieval, missing validation, and an external failure; each has a different owner. Correct an owned producer or caller now instead of adding diagnostics to discover a path the code can establish. Validate uncontrolled input where it enters. If the cause remains unknown or outside your control, name that limit and restore the user outcome the application can own.
- **Describe collaboration before states.** For a protocol or lifecycle change, walk an ordinary case and an interrupted case in domain terms: who does what, what they wait on, and what changes under them. Map implementation states to the decisions or observations they serve. Do not add states merely to represent stages of your investigation.
- **Put decisions at the boundary that can own them.** Name the domain decisions and invariants affected by the change and who owns each. When callers repeat a decision, sequencing rule, failure classification or recovery, compare owning it at their common operation before extending the repetition. Keep independently changing policies separate; keep one policy's enforcement together. Trace dependencies between domain policy, presentation, persistence and external services: a change to a delivery detail should not require rewriting the domain decision. Introduce a contract when it removes a concrete dependency or protects an invariant, not merely to put an interface in front of a class. Verify which paths the owner covers and what bypasses it. Compare total responsibility and caller effort, including any failure mechanism the structure can remove.
- **Reuse before adding.** Look for the same job in the owning module and existing libraries. Share an abstraction when its callers share a contract and should change together, not merely similar lines. Apply good-code.md's deletion test to what you add or keep.
- **Price the costs that remain expensive.** Generation and reversible experiments are cheap; regression risk, integration, interface churn and future readers' reasoning are not. Neither preserve a bad structure solely to minimize the diff nor expand a working change solely because another design exists.
- **Sweep the mechanism.** Inspect sibling sites that share the cause, contract or workaround before claiming the class is fixed. Broaden the sweep only when it can change that claim or the fix boundary.

## Write the boundary before the plan

When the structure note has a row, record the boundary you chose, before the plan: one table per owner that gains or changes an operation, with a row for every operation of that owner that writes a fact from the structure note, whether or not the change meant to touch it.

- **Operation and the fact it writes.** One job per operation. An operation that writes a second fact on the side (a setter that also re-derives a neighbouring value from its own source, a release that also decides what happens next) is two operations or a leak; say which, and split or move it.
- **Level.** How the operation's invariant is held: unrepresentable by type, refused at one gate, or a runtime check, with the reason a stronger level is unavailable. A check each caller must remember is a runtime check, not a gate; a comment or convention is no level at all.
- **What stays with the caller.** The caller's reason and sequence (which tool asked, which phase of an edit, cancel against commit) stay in the caller. An owner operation whose name or parameters carry a caller's reason is a boundary leak; rename it after the fact it writes. State what the caller must still know and do, in one sentence.

Then name the strongest simpler alternative and the bug class it leaves possible. The plan opens with the API changes these tables require; feature code follows them.

## Check the result

Disproving one proposed cause does not resolve the observed failure. State what remains unexplained and the observation that would distinguish it.

Choose checks for the actual claim. A defect reproducer before and after the change is useful when it distinguishes the cause and correction. A structural change may need preserved-behavior checks and an ownership argument; a feature needs acceptance scenarios. Do not manufacture a red run for a claim that predicts no behavior change, or present a replica as tested production wiring.

Inspect the resulting diff and affected failure paths. When responsibilities or boundaries change, restate the structure note's verdict and the boundary as implemented in the result or investigation note, with whatever implementation changed in them. Ground the comparison with the rejected alternative in an actual contract or maintenance task; an unchanged boundary needs no invented alternative. For a failure-handling change, the result states the cause repaired or the limit that remains, who owns the shared handling, and evidence of what the affected user action now does. Verify that action reaches its intended outcome; a quieter log, propagated error, or shared callback alone does not establish it. Explain material departures from the requested behavior rather than calling them fulfilled requirements. When an approach fails, preserve a useful result and its reason if later work would otherwise repeat it. Continue while a check or code walk can resolve a concrete uncertainty; another possible design is not itself unfinished work.

A separate reviewer is required only by the selected joint workflow or an explicit request for an independent reviewer, not by an ordinary request to review code. When obtaining one, use a reader who did not author the candidate. Give the goal, exact candidate and baseline, relevant rulings and evidence; let the reader assess before comparing your rationale. Their assessment covers intended behavior, evidence applicability, regressions and unresolved conditions. Preserve the rationale for the user. A preference without an unmet obligation is not a condition.
