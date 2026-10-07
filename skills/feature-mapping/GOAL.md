# Goal

Read before discussing or changing this skill.

## Why

A feature that changes a concept has one ticket and many consumers. The ticket says "load patches by bounds instead of root distance". The codebase also sorts load order by root distance, replicates the root transform during a drag, draws debug spheres at the root, and tests all of it. An agent that implements the ticket leaves every sibling on the old concept, and each one becomes a later bug that looks unrelated.

A human who has worked in the codebase for years feels the siblings. An agent has to find them. This skill is the finding: it names the concept being introduced, replaced or removed, sweeps the codebase for every place the old concept answers a question, and decides for each whether the new concept should answer it too. It runs as a review phase after the feature itself is agreed and before or during implementation.

## Values

- **A concept is a question, not a symbol.** Root position answers "where is the patch"; bounds answer "what space does the patch occupy". The sweep classifies by the question a consumer asks, so a proxy use (actor location standing in for occupancy) is found even when the symbol differs.
- **Every hit gets a class.** Must change, better with the new concept, unaffected with a reason, or a new question the new concept raises. An unclassified hit is a decision deferred to whoever reads the map, which is the failure the skill exists to prevent.
- **The new concept's lifecycle is compared with the old one's.** The old concept came with replication, persistence and invalidation that nobody wrote down as requirements. Each stage the new concept lacks is a gap, not an oversight to discover in production.
- **Coverage is explicit.** The sweep names what it searched and what it could not: cloaked plugins, missing sibling checkouts, generated code. An unsearched area is not a clean area.
- **Siblings, not progress.** The owner knows what the ticket has built and what remains; a map that reports branches, drafts and unfinished steps spends its reader's attention on what they already hold. The map lists the other features the concept touches and the questions the new concept raises. A reminder of a new question is welcome; an audit of the feature's own progress is not.
- **The map recommends; it does not edit.** The output feeds the issues and the implementation. Each recommendation is one or two sentences with a cost and a confidence, so the owner can accept, defer or reject it in the tracker.
- **The description is the boundary; the issues are the rulings.** A ticket scopes the next step of a feature. The map covers the concept the user described, marks what the tickets already cover, and does not let the ticket's scope demote a consumer the new concept would improve to an aside.
- **Issues are the rulings.** Developer decisions in the tracker bound the map. A ruling that excludes something is recorded as the reason a consumer is unaffected, not re-litigated.

## Maintenance

Test in a fresh agent context against a feature with known siblings. Preserve the prompt, skill version, map and observed miss. A miss is a consumer the map did not list or classified wrong; locate whether the sweep dimension, the question framing or the class definitions failed before editing.
