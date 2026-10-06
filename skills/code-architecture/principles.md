# Evidence by architectural principle

Read the entries selected for the report. These are evidence requests for independently readable sections, not design verdicts or a replacement coding standard. User and project contracts determine the judgment. Use only facts consequential to the inspected scope; preserve conflicting rule interpretations as explicit limits.

A whole-subsystem account checks each entry for applicability. A focused request uses its selected entries. Related principles may share source facts, but each section must explain its own relationship locally.

## 01. Separation of concerns

Identify owners of domain decisions, presentation, durable-state reads/writes and infrastructure where present. Explain consequential handoffs inside as well as between components. Distinguish executing a decision from owning it; a thread table cannot supply this distinction.

## 02. Programming by intention and capability contracts

For consequential capabilities, show caller intent, supplied inputs, result/effect meaning, required actions and ordering, and sequencing or recovery supplied by the owner. Distinguish required implementations from optional/default methods and explain the default’s consumer consequence.

## 03. Encapsulation and information hiding

Show caller-visible capabilities, exposed state/machinery and caller obligations beside what the implementation keeps private. Trace relevant declarations and callers to establish which internal choices are insulated. Provider-neutral names or hidden native handles alone do not establish this.

## 04. High cohesion

Group consequential responsibilities and knowledge by the contract they serve. Trace a narrow change to an existing rule through its decision, observation, enforcement and presentation sites. Explain which sites must change together and which serve independent contracts.

## 05. Loose coupling

Collect caller knowledge, sequencing, shared writes and progress dependencies at consequential contracts. Trace one relevant policy or representation change through actual owners and consumers, including which callers are insulated. Keep runtime handoff distinct from source dependency.

## 06. DRY: one authoritative representation of knowledge

Compare recurring rules/calculations side by side: decision sites, authoritative inputs, consumers and downstream meanings. Establish shared authority, distinct policy questions or repeated enforcement at separate trust boundaries. Similar names, code or equal constants alone do not establish shared knowledge.

## 07. KISS and local reasoning

Collect the consequential concepts, state questions and caller coordination needed for a representative operation or maintenance task. Tie them to current constraints and trace the places that task affects. Leave choice of a simpler design to the reviewer; counts alone are not evidence of simplicity.

## 08. Single responsibility

For principal components, distinguish policies they control from mechanisms carrying out another owner’s policy. Name the contract linking their responsibilities. For apparently independent decisions, trace a representative change through actual owners/interfaces without prescribing class splits.

## 09. Dependency direction and abstractions

Name policy owner, contract location and vocabulary, implementation and composition caller. Show source/module dependency direction separately from call/data flow. Explain translated or still-visible provider, persistence and presentation details, bypasses and the invariant or dependency the contract addresses.

## 10. YAGNI

Place consequential mechanisms beside present obligations, actual consumers and contribution. Include relevant non-goals and encountered unused settings or optional capabilities. Distinguish scoped non-use from unknown justification; inspect actual maintenance/test consumers before inferring speculation.

## 11. Composition over inheritance

Where relevant, show actual base-to-derived relationships, base-provided behavior/state, delegated capabilities and caller substitution/lifetime obligations. Distinguish interface inheritance from inherited policy. If no relevant hierarchy exists, state the inspected basis rather than inventing one.

## 12. Open/closed at demonstrated extension boundaries

Show an actual extension seam: contract held constant, existing variation or present obligation, binding and affected/insulated owners. State known change history separately. Multiple implementations do not prove repeated change; preserve any conflict between a twice-before-extension heuristic and a present one-caller obligation.

## 13. Law of Demeter

Show how consequential callers obtain collaborators, the capabilities they invoke, the facts returned and the decisions they compute. Distinguish published observations from another owner’s internal state. A getter chain is evidence of access, not automatically a defect.

## 14. Invalid states, invariant enforcement and fail-fast behavior

For consequential invariants, name excluded combinations, what types prevent versus runtime transitions/checks, enforcement owners and alternate writes/bypasses. Distinguish expected external failure or stale work from broken internal invariants and show each response. Expose material language/runtime safety premises or leave them unresolved.

## 15. Optimize for deletion and justify mechanisms

For mechanisms relevant to removal, connect current obligation/contribution to actual callers and dependencies that removal affects. Separate behavior that would cease from obligations still needing an owner. Identify existing alternative coverage only when source establishes it; do not invent a replacement design.

## 16. Do one thing and compose

Trace a representative capability chain through supplied inputs, produced results and effects. Expose retained/global state and ordering prerequisites, naming who enforces them. Distinguish caller obligations from internal sequencing so composition can be judged without assuming purity or counting methods.

## 17. Truthful states, labels and observable outcomes

For consequential labels and success/failure outcomes, put asserted meaning, evidence threshold, actual consuming behavior and countercases together. Distinguish intent, observation, acknowledgment and completion. Trace error/reason codes to outcomes; unsupported physical or user-visible implications remain unknown.

## 18. Authoritative state and derived consequences

For stored roots and retained copies, identify decision/observation authority, derivation, purpose, represented point/permitted lag and maintenance boundary. Cover creation, writes, invalidation and teardown. Put the relationships between copies together; a coherent-snapshot claim needs its publication and reentrancy semantics.

## 19. Compatible consumer views

For each consequential shared/filtered view, show authoritative input, selection/inclusion rules, capacity/eviction, consumers and what omission or extra inclusion makes each consumer do. Distinguish display, completion and notification meanings. Do not infer compatibility from a common data structure.

## 20. Domain states serve runtime decisions

Map consequential states/modes/flags to the runtime questions and consumers they serve. Show independent roots versus derived descriptions, legal transitions and why apparently similar states answer different questions. Include setup, replacement and teardown where these change the meaning.

## 21. Resource ownership and lifetime

For resources crossing owners or async gaps, show acquisition, retention, release, subscriptions, receiver death and teardown ordering, including teardown during dispatch. Distinguish requested cleanup from confirmed quiescence; cover ordinary and interrupted lifetimes and relevant framework/GC contracts. Keep external lifetime assumptions explicit.

## 22. Concurrency through ownership and explicit handoffs

For consequential shared mutation/handoffs, show producer/consumer contexts and cardinality, payload access, publication/reuse ordering, progress driver, stale fencing and cancellation through the outermost edge. Walk relevant synchronous-callback, teardown and replacement windows. State synchronization and memory-model/runtime premises; a stress result is not a universal safety proof.

## 23. Recovery belongs with knowledge and control

Connect failure detection and classification to the owner with user intent, knowledge and control, resulting state and actual next action. Show what callers still decide, optional-feature fallback and containment when the cause is external. An error/log/callback alone does not establish recovery.

## 24. Progress, cancellation and bounded recovery

For consequential waits/retries/queues, collect admission, capacity, overflow, progress actor, retry scope/backoff, stopping conditions, limits surviving resets and cancellation behavior. Trace late results and retained work to user/downstream outcomes. For persistent recovery, connect its purpose and clearing conditions to retained-resource bounds or unknown growth; a timeout is not native cancellation.

## 25. Defense at owned trust boundaries

Identify uncontrolled entry points, validation owner, assumptions handed to the trusting stage and alternate entry/mutation paths. Separate provider rejection, local shape checks and trusted invariants. Establish which contract excludes an internal case before treating a guard as redundant.

## 26. Design grounded in goals, obligations and concrete tradeoffs

Put relevant goals, non-goals, current rulings and contracts beside the mechanisms and tradeoffs they constrain. Preserve their provenance, qualifications and unknown authority; distinguish intended behavior from current behavior and historical proposals. Supply actual ownership/change-footprint evidence and any documented alternative's concrete costs for later comparison; do not invent alternatives or choose a redesign in the research stage.

## 27. Performance and latency at production scale

Identify shipping/default hot paths, workload dimensions, operation/allocation/locking/logging costs including argument construction, queue/provider/scheduler contributions, budgets and weakest supported hardware. Explain timebases and what observed timings measure. Distinguish storage caps from expected load and qualify historical measurements by path, revision and hardware; nominal cadence is not a latency guarantee.

## 28. Constants, units and external contracts have reasons

For consequential values, show units, sentinel/boundary meaning, source in contract/measurement/derivation, guarantor and affected consumer. Distinguish who chose a value from why that magnitude was chosen; record either missing fact explicitly. Include provider-default deviations and interpretation limits. Distinguish configured thresholds, code-derived bounds, observations and assumptions; equal values need not share one policy.

## 29. Evidence and testability at architectural boundaries

For required assurances, identify available source/contract arguments or tests that exercise real wiring, their independent expected outcome and covered input/lifecycle/platform dimensions. Explain what a test seam substitutes or bypasses. Separate inspected tests, executed results and planned checks. Explain consequential assurance gaps without inventorying unrelated tests, reopening closed acceptance work or manufacturing a defect.

## 30. Durable replicated state and authority

For cross-process facts, show authoritative writer, validation, transmitted representation, snapshot/order guarantees, late-join convergence and reconciliation behavior. Distinguish transient RPC events from durable state. Do not infer atomicity or delivery order from struct grouping or serializer names.

## 31. Reuse proven primitives and enforce real gates

Show the current primitive/library and its actual contract; for custom coordination, identify relevant existing owners/primitives within the inspected module and libraries, recording established fit or unresolved mismatch. Show each distinct enforcement boundary, consumers, meaningful bypasses and installation/replacement effects. Where hooks or guards are in scope, show what rejects alternate forms. Absent hooks need no invented hook audit or broad library survey.

## 32. Change impact, sibling coverage and truthful documentation

Bound claims over all consumers/sibling paths of consequential facts and record inspected versus excluded variants. Tie code/docs/evidence to their revisions, preserve historical claims as historical and expose contradictions. Explain why a covered path supports—or does not support—a wider claim.

## 33. Logging and diagnostic state

Explain how the subsystem's required outcomes can be diagnosed at the required destination. Read its logging, monitoring and privacy contracts. Cover important decision inputs, states, transitions and outcomes, including facts needed to distinguish remaining causes. Bound this to the inspected subsystem; do not inventory every field or assume every internal state should be logged.

Start with a logging coverage map from the subsystem's real flows: required setup/configuration, admission and validation decisions, execution/completion, recovery, and retained summaries where present. Name each outcome producer, diagnostic carrier/recorder and sink, with inspected or excluded coverage. Include paths that emit no log or fail before the usual owner exists; a log-site search cannot find them. Follow required neighboring producers without turning an explicitly focused request into a whole-repository audit.

Collect a diagnostic state table. For each important fact or related group, show:

- Origin and meaning: external data or provider/environment observation, owned internal decision/invariant, or a derived diagnostic view. Name the authority, observation time and confidence. External data can be malformed at an owned boundary; an external failure can also expose a separate owned handling defect.
- Availability and lifetime: immediate-only input, retained state/snapshot, derived on emission, or unavailable. Name the holder, purpose, update/reset/overwrite/teardown boundaries and represented time. Trace the actual writer/reset path through callback admission, generation fences and wrappers; a reset function does not prove every qualifying completion reaches it. State whether delayed logging keeps the original observation and identity or reads current replacement state.
- Emission and companions: which event carries it, when and with which other state, reason/result, action/stage and target or operation identity. Show whether the fields describe one coherent failure/transition. For split events, identify the actual correlation and ordering evidence, including attempt/session reuse; do not assume timestamps or nearby lines establish causality.
- Visibility and loss: selected severity/category, build/runtime gates and local/remote destination. Trace filtering, sampling, truncation, aggregation or queue loss where they affect the required evidence. Mark important facts that are held but never emitted, immediately discarded, or only visible at an insufficient destination. Redaction and unavailable evidence remain explicit; do not copy secrets or demand private raw data in remote logs.

Put failure classification beside its governing policy, separately from the fact's origin and any provider label. Explain responsibility, expected outcome, monitoring obligation and actual response. Preserve unmapped cases and conflicting policy authority as limits rather than inferring severity from words such as Error or Fatal.

Trace distinct decision predicates through reason/result construction, wrappers, serialization and the eventual diagnostic. Show which distinctions survive a many-to-one code or label, which consumers need them and any precedence when multiple predicates hold. A correct retry class can still discard the admission owner's causal detail. Required-setup failures include missing input, invalid shape and downstream construction failure; show the diagnostic owner for each without duplicating an already-owned failure or logging configuration secrets.

For relays/classifiers, provide a compact policy-to-output table across material input categories/signatures and admitted provider levels. Show branch precedence, overrides, fallback and sink thresholds, plus nearby normal chatter and unrelated genuine-error controls. Identify which original fields survive translation; a mapped severity does not recover the native severity.

For failure episodes and summaries, show emission owner, cardinality, suppression/aggregation key and reset after recovery. Distinguish duplicate rows, distinct failures, interim evidence and terminal outcomes. Account for evidence surviving retries, replacement, cancellation and teardown when those paths are in scope. Keep native cause, observed outcome and inference distinct; silence at a filtered sink does not prove success. Logging is evidence, not recovery. Trace any non-diagnostic effects of logging operations when present.

For each retained episode sample, record its selection/enrichment rule and represented interval separately from the episode start. Walk a period that starts without that evidence and gains it later, changes fault kind, or changes the sampled subject. Show whether the first complete required sample can be adopted then, whether later partial data overwrites it, and how the summary identifies its actual observation time. Bounded history and correct fault counts do not prove that available companion evidence survives aggregation.
