# Good change

Design and boundary judgment for implementation, review and diagnosis. These principles apply at every level; they do not require an investigation record, independent reviewer, or team. SKILL.md owns read selection, authority and the selected level. For deep work, investigation.md owns the method.

## Establish the outcome

For a feature, identify the intended experience and the scenarios that distinguish success from a merely completed implementation. Separate user rulings from implementation choices. For a defect, identify the bad state and the mechanism that produces it. For a maintenance change, name the concrete task or failure boundary made easier to reason about. Do not invent a bug to justify a requested feature.

Walk the relevant callers, owners and failure paths before selecting the boundary. Check existing docs, tests, and retained captures before calling a behavior blocking or untested; incidental coverage counts only when the artifact shows the relevant state. They are evidence to check against the goal, not reasons to preserve accidental behavior. Keep an acceptance explanation proportional to the choice the user needs to understand.

## Choose the boundary

- **Fix the cause where it can be owned.** When a failure reaches a guard or log, trace its input through the callers to the producer before choosing the fix. Distinguish a failed retrieval, missing validation, and an external failure; each has a different owner. Correct an owned producer or caller now instead of adding diagnostics to discover a path the code can establish. Validate uncontrolled input where it enters. If the cause remains unknown or outside your control, name that limit and restore the user outcome the application can own.
- **Describe collaboration before states.** For a protocol or lifecycle change, walk an ordinary case and an interrupted case in domain terms: who does what, what they wait on, and what changes under them. Map implementation states to the decisions or observations they serve. Do not add states merely to represent stages of your investigation.
- **Look for a structure that removes the failure mechanism.** When callers repeat failure classification, recovery, or user notification, trace them to their common operation and compare handling the failure there before extending the repetition. Put each shared decision at the owner with the needed information and control; keep distinct action outcomes with the callers that own them. Verify which paths the shared mechanism covers and what bypasses it. Compare total responsibility and caller effort, not just interface size or lines removed.
- **Reuse before adding.** Look for the same job in the owning module and existing libraries. Share an abstraction when its callers share a contract and should change together, not merely similar lines. Apply good-code.md's deletion test to what you add or keep.
- **Price the costs that remain expensive.** Generation and reversible experiments are cheap; regression risk, integration, interface churn and future readers' reasoning are not. Neither preserve a bad structure solely to minimize the diff nor expand a working change solely because another design exists.
- **Sweep the mechanism.** Inspect sibling sites that share the cause, contract or workaround before claiming the class is fixed. Broaden the sweep only when it can change that claim or the fix boundary.

## Check the result

Disproving one proposed cause does not resolve the observed failure. State what remains unexplained and the observation that would distinguish it.

Choose checks for the actual claim. A defect reproducer before and after the change is useful when it distinguishes the cause and correction. A structural change may need preserved-behavior checks and an ownership argument; a feature needs acceptance scenarios. Do not manufacture a red run for a claim that predicts no behavior change, or present a replica as tested production wiring.

Inspect the resulting diff and affected failure paths. For a failure-handling change, the result states the cause repaired or the limit that remains, who owns the shared handling, and evidence of what the affected user action now does. Verify that action reaches its intended outcome; a quieter log, propagated error, or shared callback alone does not establish it. Explain material departures from the requested behavior rather than calling them fulfilled requirements. When an approach fails, preserve a useful result and its reason if later work would otherwise repeat it. Continue while a check or code walk can resolve a concrete uncertainty; another possible design is not itself unfinished work.

A separate reviewer is required only by the selected joint workflow or an explicit request for an independent reviewer, not by an ordinary request to review code. When obtaining one, use a reader who did not author the candidate. Give the goal, exact candidate and baseline, relevant rulings and evidence; let the reader assess before comparing your rationale. Their assessment covers intended behavior, evidence applicability, regressions and unresolved conditions. Preserve the rationale for the user. A preference without an unmet obligation is not a condition, and a finished child report is not its parent's acceptance.
