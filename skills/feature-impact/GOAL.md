# Goal

Read before discussing or changing this skill.

## Why

A feature changes assumptions in other features. Making content load on demand can leave search returning valid results whose click action needs an object that no longer exists in memory. Replacing a position with bounds can leave sorting, replication and debug tools answering the old question. These interactions are easy to miss when attention stays on the feature being built.

A human who has worked in the codebase for years remembers related features. An agent has to find them. This skill names the changed concepts and assumptions, searches their consumers, and follows user actions through those consumers. It produces a map the owner can scan and decide on, before, during or after implementation. It does not require complete project knowledge.

## Values

- **A concept is a question, not a symbol.** Root position answers "where is the patch"; bounds answer "what space does the patch occupy". The sweep classifies by the question a consumer asks, so a proxy use (actor location standing in for occupancy) is found even when the symbol differs.
- **Missing an interaction costs more than dismissing a useful candidate.** Keep concrete improvements, intentional tradeoffs and unresolved candidates visible alongside confirmed bugs. Separate their certainty and consequence. Do not limit the map to novel defects or a fixed number of findings.
- **A feature is more than its first data read.** Search can query the right records while opening a result still needs a loaded object. Follow the action to its outcome before calling it unaffected. Safe failure for the program can still mean a broken action for the user.
- **Every candidate gets a disposition.** Needs a fix, worth considering, unaffected with a reason, or unresolved with a fact that would settle it. Deduplication groups repeated evidence, not distinct consequences. The final answer preserves the map's useful breadth.
- **The new concept's lifecycle is compared with the old one's.** The old concept came with replication, persistence and invalidation that nobody wrote down as requirements. Each stage the new concept lacks is a gap, not an oversight to discover in production.
- **Coverage is explicit.** The sweep names what it searched and what it could not: cloaked plugins, missing sibling checkouts, generated code. An unsearched area is not a clean area.
- **Use the smaller model for research.** GPT-6.1 Sol should be able to discover and report the map. In Codex, use Sol for codebase sweeps and reserve at most one optional Astra pass for joining evidence, challenging classifications or brainstorming missing interactions. Escalation must add judgment rather than repeat the repository search. Other providers can run the same workflow with their available models.
- **Siblings, not progress.** The owner knows what the ticket has built and what remains; a map that reports branches, drafts and unfinished steps spends its reader's attention on what they already hold. The map lists the other features the concept touches and the questions the new concept raises. A reminder of a new question is welcome; an audit of the feature's own progress is not.
- **The map recommends; it does not edit.** Lead with the affected user behavior and a practical next step, with evidence the owner can inspect. Concept tables and coverage support the findings rather than burying them.
- **The user's description is the boundary.** Use supplied decisions and relevant project guidance. Issue trackers and prior reports are optional context, not prerequisites or a reason to suppress an interaction. An intentional behavior can still affect another workflow.
- **Impact mapping and feature design have different jobs.** This skill follows the consequences of a proposed change. A discussion about the underlying goal and alternative designs can start independently and deserves its own workflow. A concrete design question found during the map is welcome; a mandatory redesign exercise is not.

## Maintenance

Test in a fresh agent context against a feature with known siblings. Use [the behavioral cases](evals/cases.md) for regression checks. Preserve the prompt, skill version, map and observed miss. A miss is a consumer the map did not list or classified wrong; locate whether the sweep dimension, the question framing or the class definitions failed before editing.
