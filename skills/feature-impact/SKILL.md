---
name: feature-impact
description: "Use when the user describes a planned, in-progress or recently completed feature and asks what else it affects, which related features or workflows need updating, what assumptions it changes, or what they may have missed."
---

# Feature impact

Find the other features and workflows affected by a change. Map the consequences and useful follow-ups; do not edit code or issues. The owner knows the feature's own implementation progress.

## 1. Name the changed assumptions

Read the user's description, applicable project guidance and the code that owns the change. Use supplied decisions as constraints. Read linked context when it settles a specific uncertainty; do not make a tracker search or traversal of related issues a prerequisite.

Keep a short working table: changed concept; the question it answers; before and after; affected modes or users. Include changes in ownership, availability and timing even when no field changed. For example, "exists in storage" and "available in memory" may have become different questions. Record which uses still need the old meaning.

Name the representations and owners needed to search, and the facts still unknown. Start the sweep when each changed assumption has a question and a before/after statement. Resolve unknowns as consumers require them; do not wait to understand the whole subsystem.

## 2. Search from both the implementation and its uses

Build a working coverage table with these columns: changed assumption; search terms and directories; candidate consumers; checked or unresolved. Use both directions:

- **Implementation outward.** Search fields, getters, setters, aliases, copies and caches. Follow derived decisions such as ordering, priority, filtering, eligibility and scheduling. Look for proxies where a different value stands in for the concept, such as object presence standing in for existence.
- **User action inward.** Identify the features that relied on each old assumption. Find their entry points and follow the action to its outcome. Include actions on listed or selected items, background work, settings, recovery, and inspection where relevant. Name effects the old representation supplies, such as collision, registrations or event subscriptions, and find who relies on those effects. These consumers may never name the changed type or field.

For each changed assumption, also check its wire/storage consumers and its tooling, tests, counters and documentation. Include debug commands and scenario helpers that count, poll or assert the old representation, even when the production feature no longer uses them. Follow process boundaries into the repositories named by project guidance when relevant. Extend search terms from the callers and representations you discover; one initial keyword list does not establish coverage.

If the sweep needs parallel readers, delegate independent assumptions or user workflows with clear ownership. Delegates return candidates, evidence, searches and unresolved call paths. The lead owns joining paths across assignments and the final classification. Without subagents, use the same coverage table sequentially.

In Codex, use `gpt-6.1-sol` for repository research when model selection is available. An Astra lead delegates those sweeps to Sol. A Sol lead can finish the map itself; use at most one optional Astra subagent after research to join evidence, challenge classifications or suggest missing interactions. Give that reviewer the changed assumptions, candidate list and coverage gaps. Return targeted follow-up reads to Sol rather than repeating the sweep with Astra. On other providers, use available models without requiring cross-provider orchestration.

If search output is truncated, narrow it or inspect the remaining results before marking the area covered. Before closing an area, account for every distinct consumer of the changed assumption found in its matches or reads. Give each its question and either follow it to an outcome or retain it as unresolved with the missing check. Group consumers only when they ask the same question under the same conditions; checking a file, helper or guarded branch does not cover its other consumers.

End the sweep when each assumption has been checked from both directions and each discovered consumer has a disposition or named coverage limit. Keep this candidate list through synthesis; distinct consequences cannot disappear just to shorten the answer.

## 3. Follow each candidate to its consequence

For each candidate, record:

- The affected feature or action, its entry point and the consumer of the changed assumption, with locations.
- The triggering condition, including applicable modes, and the observable result.
- Its disposition: **needs a fix**, **worth considering**, **unaffected**, or **unresolved**. For an unresolved candidate, name the missing fact and the check that would settle it.
- A next step and any material cost or tradeoff. Separate what the code proves from what you infer about intended behavior. If a required link from the trigger to the consequence is unverified, classify the candidate as unresolved.

Do not call a whole feature unaffected because one helper reads the right data. Follow the next action and its failure path. A null check can prevent a crash while silently swallowing a click. A query can return the full list while selection still requires an object that is absent. Where callers are in UI assets, scripts, generated bindings or another service, inspect that boundary through the project's supported tools. If it is unavailable, keep the specific action unresolved rather than declaring it safe.

For each changed lifetime or availability assumption, list the newly possible transitions and a consumer disposition for each: absent when an action starts, disappearing during pending work, returning before that work completes, and returning after completion or failure. Read both the operation and the code that recreates or refreshes its state. A record-based command can succeed while its optimistic presentation reappears, a callback never finishes, or a polling helper never advances.

Compare other relevant lifecycle stages, including update, persistence, replication and teardown. Check which consumers require fresh values. Put lifecycle gaps with their affected feature rather than repeating them in a second findings list.

Trace mode differences before saying an effect is local-only, remote-only or universal. Distinguish a newly exposed effect in one mode from the same effect already present elsewhere. Known intent is a disposition, not proof that every downstream use is unaffected. For example, an intentional setting may change the workload of a performance comparison.

Keep concrete improvements and plausible interactions even when a future feature may address them. Mark known coverage or accepted intent briefly if supplied or encountered; do not search the tracker just to deduplicate recommendations. Exclude the changed feature's own progress and remaining implementation steps, but retain consequences for its consumers.

## 4. Write the impact map

Lead with the findings, grouped by consequence. Use the natural number of items, not a top-five limit. Each item names the affected action, condition and result, then gives a next step and supporting locations. State uncertainty beside the claim; use confidence or cost labels only when they help the owner decide.

Required sections:

1. **Needs a fix.** Verified incorrect behavior in related features, most consequential first. Say explicitly if none was established.
2. **Worth considering.** Smaller items, improvements and concrete interactions that may be intentional. Include unresolved candidates here with the missing check. Keep distinct candidates individually visible. Group tooling and stale docs here unless their consequence warrants the first section.
3. **Decisions.** Choices exposed by the interactions, with the alternatives and what would decide between them. Omit when none. Do not turn this into a mandatory redesign of the original feature.
4. **Scope and coverage.** A short before/after summary, important unaffected paths with reasons, search terms and areas, and uninspected boundaries. Include the feature's own work set aside in one line. Keep detailed working tables here or in an appendix only when they help check the map.

Before sending, reconcile the candidate list with the answer. Every useful candidate must appear or have a concrete unaffected/duplicate/feature-owned reason for exclusion. If also saving a report, preserve every distinct actionable or unresolved candidate in the chat answer, even as a short grouped bullet. A short summary must not hide the smaller findings.

Return the map in chat unless the user requests a saved report or the ongoing workflow already has a report destination. Do not invent a tracked documentation file. Stop at recommendations; implementation and issue edits are separate requests.
