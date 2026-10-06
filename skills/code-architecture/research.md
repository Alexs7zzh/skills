# Research architecture for one-principle reviews

Produce factual evidence for a later reviewer. Do not judge the design or propose replacements. Each requested principle gets a section the reviewer can use with only the report's short orientation.

## 1. Select the questions and pin the source

Read project instructions, the subsystem's goals/rulings, and the requested entries in [principles.md](principles.md). For a whole-subsystem request, check every entry for applicability; for a focused request, use its selected entries. Preserve any conflict between supplied rules instead of silently choosing one.

Record the inspected revision, relevant local changes, source access method and excluded areas. For unversioned source, use the supplied snapshot/version and content hashes of inspected files; state when no change baseline is available. Separate current obligations, historical proposals and source behavior. Keep the exact meaning and provenance of a ruling; unknown authority stays unknown.

Make an applicability index: in scope, not applicable with the inspected reason, or unresolved. Missing evidence is unresolved, not not-applicable.

## 2. Find the evidence each question needs

For each selected entry, list the facts that could change its judgment or limit that judgment. Find their public contracts, actual callers/consumers, decision sites, stored values and external operations. Include adjacent code and platform/build branches only where they affect those facts. Keep this working inventory in research notes; no separate inventory artifact is required unless requested. Do not paste it into the report.

Use these traces when the selected question needs them:

| Question concerns | Trace to collect |
| --- | --- |
| Responsibility, contracts or insulation | Policy owner → executor → actual caller. Read public operations/data/defaults, caller prerequisites, implementation binding and source/module dependencies. Follow the actually installed wrappers and inherited defaults for each consequential capability; a decorator name does not prove forwarding. List behavioral effects executed by output, telemetry or notification operations as well as their declared purpose. Separate caller-enforced ordering from sequencing supplied by the owner. |
| Change together, extension, duplication or deletion | Choose an existing rule or representation. Follow its decision, enforcement and consumption sites through the actual binding. Put the governing requirement beside the implemented scope; state which sites must change together and which are insulated. For deletion, identify dependencies and surviving obligations. Do not invent a replacement owner or future requirement. |
| State, views or invariants | Writer → authoritative inputs → stored/derived value → each consumer → update/invalidation/teardown. State a retained copy's purpose and permitted lag. Separate combinations excluded by types from those prevented by checks; inspect material alternate writes. |
| Async work, lifetime or concurrency | Producer → handoff → receiver → final consumer. Record contexts, payload, publication/order, synchronization, progress and retention/release. Carry an observation's original time and clock domain through every queue and adoption step to the freshness, age or deadline consumer. Identify any receipt or completion that replaces that origin. Walk synchronous completion, replacement and teardown windows where they change the result. |
| External operations | Inspect invocation separately from completion: blocking evidence, progress driver, callback context, result/failure meaning, cancellation and cleanup. Before interpreting a result, establish what effects can precede failure and whether exceptions or partial effects are covered by the contract. A callback API does not prove a nonblocking invocation; timeout, notification removal and provider cancellation are different events. |
| Failure, retries or time | Walk ordinary success and each materially different interruption/failure. Record detector, remaining state, progress actor, retry/reset/stopping conditions, retained work and downstream outcome. Put units and clock start/end beside each relevant interval; distinguish configured values, derived bounds, measurements and unknowns. |
| Logging or diagnostic sufficiency | Use principle 33 to trace important facts from origin and retention through emission, classification and the required sink. Collect its diagnostic state and policy-to-output tables, including related states emitted together and material loss paths. |

Read both declarations and relevant callers. A class list, narrow API or thread table does not establish policy ownership. For external guarantees, use version-matched provider declarations/contracts; code comments establish only source intent. If evidence cannot establish a claim, record the missing fact and which conclusion it prevents. Do not fill it with an assumption or launch an unrequested experiment.

Stop expanding a trace when the selected question's relationship and consumer outcome are explained, or when you can name the specific unresolved boundary. A discovered fact belongs in a section only if it changes or limits that principle's judgment.

## 3. Write the review sections

Start with a short orientation: target/revision, purpose and governing constraints, boundary, evidence status and applicability index. Give the ordinary path briefly. Label source-established behavior, provider guarantees, measurements and unresolved claims distinctly. Source-established means expressed in code, not runtime-confirmed.

Give each selected principle its own named section with these slots:

- **Question and scope:** state the question and inspected paths. A not-applicable entry needs only its inspected basis.
- **Evidence:** explain the facts and relationships this question needs. Name a component's role before its symbol. Use the relevant trace from step 2; include countercases and constraints that change interpretation. Use a table only when comparison helps.
- **Limits:** state each unresolved fact, the in-scope judgment it blocks and the source, observation or ruling that would settle it. Do not add missing-contract questions for hypothetical providers or requirements outside the inspected scope. Distinguish missing research from a documented external unknown. Identify executed, inspected-but-unexecuted and proposed checks accurately.
- **Sources:** cite consequential claims at their locations, pinned to the revision. Inline citations satisfy this slot; do not repeat them in another source list.

When principle 33 applies, its section must contain **Logging and diagnostic state**, with the diagnostic state table and, for a relay/classifier, the policy-to-output table defined there. Include important unlogged or unavailable facts with their disposition. A list of log sites or severity names does not supply this evidence.

Explain each relationship once within its section. When two principles need the same fact, repeat only the relationship needed for the second question and keep its provenance consistent. Never substitute “see another section” for that explanation. Keep long inventories, raw traces and content hashes in a shared appendix; they verify the report, rather than supply its factual argument. Do not include credentials or tokens.

## 4. Check before handing off

Read each section with only the orientation. Can the reviewer identify the relevant owners, relationship, supporting facts and limits without reading another section or rediscovering them in source? If not, add the missing relationship locally. Remove facts that do not affect that principle and repeated explanations inside the section.

Reconcile the applicability/coverage inventory with the sections. Reconcile delegated claims with the source on both sides of the boundary during integration. Check repeated facts, exact operation names, owners and lifecycle/completion claims at that point; do not repeat a completed source audit just to certify the report. For a claimed transparent wrapper, show which consumed capabilities reach the inner owner; for a timed fact, show the retained origin and its final consumer; for an output-only operation, account for its actual side effects. If one of those relationships is missing, repair the account or name the gap. File hashes and valid links cannot establish these relationships. Check client/server and platform variants separately when their contracts differ. Preserve revision-specific excerpts when the working tree is different.

Finish when every selected question has the relevant evidence or a specific unresolved limit. For logging, reconcile the important decision/outcome facts with the diagnostic state table and the policy-to-output paths; retain omissions as named gaps. Report the checks actually performed. Keep skill-trial observations separate from the architecture evidence.
