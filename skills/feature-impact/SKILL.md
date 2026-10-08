---
name: feature-impact
description: "Use when the user describes a planned, in-progress or recently completed feature and asks what else it affects, which related features or workflows need updating, what assumptions it changes, or what they may have missed."
---

# Feature impact

Find the other features and workflows affected by a change. Map the consequences and useful follow-ups; do not edit code or issues. The owner knows the feature's own implementation progress.

## 1. Name the changed assumptions

Read the user's description, applicable project guidance and the code that owns the change. Treat the selected feature and supplied decisions as constraints. Map their consequences without reopening the feature's purpose, whether to build it, or its choice of design. Read linked context when it settles a specific uncertainty; do not make a tracker search or traversal of related issues a prerequisite.

Before dispatching consumer research, write a short working table: changed concept; before and after by mode or user; guarantees gained or lost; consumer questions and search phrases. Include ownership, availability and timing even when no field changed. Phrase each change from both sides: what becomes available or possible, and what is no longer available or guaranteed. For example, complete records can coexist with incomplete loaded objects; ask both who can now use the records and who still needs an absent object. Use alternate domain terms for those questions. Mark inferred guarantees and exceptions for verification rather than treating a rephrasing as proof.

Name the representations and owners needed to search, and the facts still unknown. Start the sweep when each changed assumption has a before/after statement and consumer questions for its gained or lost guarantees. Resolve unknowns as consumers require them; do not wait to understand the whole subsystem.

## 2. Expand the effects and search their consumers

Keep a working coverage table: changed assumption or derived effect; evidence for that connection; consumer and question; search/read locations; action outcome; other changed effects; disposition or next check. Add a row when a relevant consumer appears in a search or read, before deciding whether it is affected. Use both directions:

- **Implementation outward.** Search fields, getters, setters, aliases, copies and caches. Follow derived decisions such as ordering, priority, filtering, eligibility and scheduling. Look for proxies where a different value stands in for the concept, such as object presence standing in for existence.
- **User action inward.** Identify the features that relied on each old assumption. Find their entry points and follow the action to its outcome. Include actions on listed or selected items, background work, settings, recovery, and inspection where relevant.

Expand in rounds. First name effects the old representation supplies, such as collision, registrations, resource ownership or event delivery. Search for consumers of those effects, including consumers that never name the original type. When a consumer's output or guarantee changes, enter that derived effect in the table and search its consumers in the next round. Record the connection that justifies each expansion; do not expand unrelated neighbors merely because they share a file. Reuse an existing row for the same question and condition rather than looping through it again.

For each changed assumption, also check its wire/storage consumers and its tooling, tests, counters and documentation. Include debug commands and scenario helpers that count, poll or assert the old representation, even when the production feature no longer uses them. Follow process boundaries into the repositories named by project guidance when relevant. Extend search terms from the callers and representations you discover; one initial keyword list does not establish coverage.

For a broad sweep with independent concept clusters, use parallel readers when available. Group questions that share an assumption and its consumers; alternate phrasings stay in the same cluster. Record an owner for every cluster before dispatch, including work the lead keeps. Give each reader the shared assumption table, its questions and relevant mode differences. Delegates return consumer rows, new derived effects and unresolved links, including unaffected reasons. The lead joins results across clusters and assigns newly discovered questions for the next round. Without subagents, use the same ownership and coverage table sequentially.

In Codex, use `gpt-6.1-sol` for repository research when model selection is available. An Astra lead delegates those sweeps to Sol. A Sol lead can finish the map itself; use at most one optional Astra subagent after research to join evidence, challenge classifications or suggest missing interactions. Give that reviewer the changed assumptions, candidate list and coverage gaps. Return targeted follow-up reads to Sol rather than repeating the sweep with Astra. On other providers, use available models without requiring cross-provider orchestration.

If search output is truncated, narrow it or inspect the remaining results before marking the area covered. A reference to an asset, script or handler is an unfinished link until its relevant behavior is read or recorded as unavailable. Group consumers only when they ask the same question under the same conditions; checking a file or helper does not cover its other consumers.

End expansion when each assumption has been checked from both directions, no newly found affected output or guarantee remains to be followed, and every discovered consumer has a disposition or named coverage limit. If a boundary cannot be inspected, record the specific missing connection rather than treating the area as complete. Follow the next section while filling the table; depth is not a substitute for checking interacting states.

## 3. Follow each candidate to its consequence

For each candidate, record:

- The affected feature or action, its entry point and the consumer of the changed assumption, with locations.
- The triggering condition, including applicable modes, and the observable result.
- Other changed effects even when the action works: resource work or retention, later retry/re-entry, timing, and what a measurement now represents. Record a concrete effect or why none changes for this consumer; a safe guard alone does not answer these questions.
- Its disposition: **needs a fix**, **worth considering**, **unaffected**, or **unresolved**. For an unresolved candidate, name the missing fact and the check that would settle it.
- A next step and any material cost or tradeoff. Separate what the code proves from what you infer about intended behavior. If a required link from the trigger to the consequence is unverified, classify the candidate as unresolved.

Do not call a whole feature unaffected because one helper reads the right data. Follow the next action and its failure path. A null check can prevent a crash while silently swallowing a click. A query can return the full list while selection still requires an object that is absent. Inspect UI assets, scripts, generated bindings and service boundaries through the project's supported tools.

For each changed lifetime or availability assumption, list the newly possible transitions and a consumer disposition for each: absent when an action starts, disappearing during pending work, returning before that work completes, and returning after completion or failure. Read both the operation and the code that recreates or refreshes its state. A record-based command can succeed while its optimistic presentation reappears, a callback never finishes, or a polling helper never advances.

Join states that can overlap in the same workflow. For suspension, ownership transfer or a temporary override, inspect entry, work while that state holds, and exit/restoration. Check whether state can change during the interval and which owner restores each affected value. A correct entry path does not establish a correct return path.

An unaffected disposition must name the exact condition its protection handles. Check neighboring reachable states separately: a stationary guard does not cover movement, and an arrival safeguard does not establish that an earlier destination query had complete inputs. Compare relevant update, persistence, replication and teardown paths, including consumers that require fresh values. Put each consequence with its affected feature.

Trace mode differences before saying an effect is local-only, remote-only or universal. Distinguish a newly exposed effect in one mode from the same effect already present elsewhere. Keep intentional or pre-existing interactions when the change exposes them in another mode or changes their frequency, cost or interpretation. Report action correctness separately from those effects; for example, a setting can work correctly while changing a performance comparison's workload.

Keep concrete improvements and plausible interactions even when a future feature may address them. Mark known coverage or accepted intent briefly if supplied or encountered; do not search the tracker just to deduplicate recommendations. Exclude the changed feature's own progress and remaining implementation steps, but retain consequences for its consumers.

## 4. Write the impact map

Lead with the findings, grouped by consequence. Use the natural number of items, not a top-five limit. Each item names the affected action, condition and result, then gives a next step and supporting locations. State uncertainty beside the claim; use confidence or cost labels only when they help the owner decide.

Required sections:

1. **Needs a fix.** Verified incorrect behavior in related features, most consequential first. Say explicitly if none was established.
2. **Worth considering.** Smaller items, improvements and concrete interactions that may be intentional. Include unresolved candidates here with the missing check. Keep distinct candidates individually visible. Group tooling and stale docs here unless their consequence warrants the first section.
3. **Consumer decisions.** Choices about adapting affected workflows to the selected feature, with the alternatives and what would decide between them. Omit when none.
4. **Scope and coverage.** A short before/after summary and a compact table of assumption clusters, research owners, derived effects, consumer outcomes and uninspected links. For important unaffected paths, name the condition checked and why neither the action nor its other effects need attention. Include search terms and areas, and the feature's own work set aside in one line. Keep the detailed consumer rows in an appendix if needed.

Before sending, reconcile every consumer row with the answer, including consequences described incidentally in another item's evidence. Each must appear or have a concrete unaffected/duplicate/feature-owned reason for exclusion. Do not merge different user outcomes just because they use the same destruction hook, setting or counter. If also saving a report, preserve every distinct actionable or unresolved candidate in the chat answer, even as a short grouped bullet.

Return the map in chat unless the user requests a saved report or the ongoing workflow already has a report destination. Do not invent a tracked documentation file. Stop at recommendations; implementation and issue edits are separate requests.
