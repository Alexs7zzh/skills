---
name: feature-mapping
description: "Use when a planned or in-progress feature introduces, replaces or removes a concept (a field, representation, rule or signal) and the user asks what else should change, where else it is used, which other features are affected, what they may have missed, or to map the feature's impact before or during implementation."
---

# Feature mapping

A feature changes a concept. Find every other place the old concept answers a question and decide whether the new concept should answer it instead. The owner knows how far the feature itself has got; do not report implementation progress, branches, drafts or the ticket's own remaining steps. Report the map; do not edit code.

## 1. Pin the concept delta

Read the feature description and its issues, following links into parent, sibling and blocking issues and their comments. The user's description sets the concept boundary; the issues supply rulings and are often narrower, scoped to the next ticket. When they are narrower, map the described concept and mark which rows the issues already cover, so a consumer the new concept would improve is a row, not an aside. Developer rulings bound the map. Write a delta table with one row per concept introduced, replaced or removed. Columns: concept; the question it answers; representation (type, field, replicated property, column, message field); owner and source of truth; lifecycle (created, updated, invalidated, persisted, replicated, and how often). A concept is a question, not a symbol: root position answers "where is the patch", bounds answer "what space does the patch occupy". A replaced concept usually keeps answering some questions; write which.

Done when every concept the description names has a row and every row has a question.

## 2. Sweep the consumers of the replaced concept

Search the codebase for every place the old concept answers a question. One sweep per dimension:

- Symbols: the field, getter, setter, and every alias, copy or cached value.
- Derived quantities: distance, sort keys, priorities, culling, relevancy, level of detail, streaming and scheduling decisions computed from it.
- Wire and storage: replicated properties and their frequency or priority, RPC and message payloads, saved or serialized fields, schema columns and migrations, config keys.
- Proxies: a stand-in for the concept, such as actor location used for occupancy or a transform used for size.
- Tooling and tests: editor utilities, debug draws, console commands, telemetry and log fields, tests, docs.
- Sibling repositories the project instructions name as owners of schema, server or client code, when the concept crosses a process boundary.

Record each hit with its location, the question it answers there, and how it reads the concept: direct, derived or proxy. Record the search terms and directories used, and everything unavailable (cloaked or absent plugins, missing checkouts, generated code) as excluded coverage. When the sweep exceeds what one agent reads carefully, delegate by directory or repository; delegates return hits with their questions, and the lead classifies.

Done when every hit has a question and the coverage record names what was and was not searched.

## 3. Classify each consumer

Give each hit one class:

- **Must change**: another feature is incorrect once this one lands unless it changes too.
- **Better with the new concept**: same question, better answer. Load order by root distance becomes load order by distance to bounds. State what improves and what it costs.
- **Unaffected**: the question genuinely needs the old concept (placement, attachment, pivot). State why.
- **New question**: the new concept raises a question nobody asked before. Bounds change during a live drag, so how often are they replicated; bounds are unknown for a never-visited patch, so what is the fallback.

A hit that is the feature's own implementation, the work the ticket already describes, is not a sibling: list it in one line under coverage and do not map it. A hit you cannot classify is unresolved, with the fact that would settle it. Done when no hit lacks a class.

## 4. Compare lifecycles

Put the old concept's lifecycle beside the new one's, stage by stage: who creates, updates, invalidates, persists and replicates each, and how often. Every stage the old concept has, the new one lacks, and the ticket does not already plan is a gap row; a stage the ticket plans is the feature's own work. For each consumer class, note its freshness tolerance: which consumers accept a stale value and which do not.

Done when the comparison has a row for every lifecycle stage in the delta table.

## 5. Write the feature map

Required sections, in this order, with no status preamble:

1. **Concept delta**: the table from step 1.
2. **Related features to update**: must-change, better-with and new-question hits grouped by feature, ordered by consequence. Each with locations as path and line, the recommended change in one or two sentences, its cost, and a confidence.
3. **Unaffected consumers**, each with its reason.
4. **Lifecycle gaps**: the rows from step 4.
5. **Open decisions**: tradeoffs the owner must rule on (granularity, update frequency, fallback), each with the options and the fact that decides it.
6. **Coverage**: searched, excluded, unresolved, and the feature's own work set aside in one line each.

Cite issues by number and code by path and line. Write the map to the location the user names, otherwise beside the request's working notes, never into tracked source. Stop at the map; implementation and issue edits are separate requests.
