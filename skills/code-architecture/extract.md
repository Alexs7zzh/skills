# Extract the constraint model

Write a code-free account of the subsystem's constraints for agents that will not read the source. State facts; do not judge the design or propose changes. Each model section must work for a reader who has only the orientation and that section.

## 1. Pin the source, the boundary and the lenses

Read project instructions, the subsystem's goals and rulings, and [lenses.md](lenses.md). Select lenses by its Selection rule. Record the inspected revision, relevant local changes, access method and excluded areas. For unversioned source, record content hashes of inspected files. Separate current obligations, historical proposals and source behavior. Preserve a conflict between supplied rules instead of choosing one.

Bound the subsystem by the producers of the requested outcome, not by the component where a symptom appeared. Name the consequential paths an explicit narrower request excludes.

## 2. Collect the evidence

For each model section, find the public contracts, actual callers, decision sites, stored values and external operations that supply its rows. Read declarations and callers both. Include adjacent code and platform or build branches only where they change a row. Keep the working inventory in notes; it is not a report artifact.

For every row, record how the fact is enforced today: by type, at a single gate, by a caller check, by convention, or not at all. This is the current form the compare stage judges against the design.

Use these traces:

| Section | Trace |
| --- | --- |
| External contracts | Inspect invocation separately from completion: blocking evidence, progress driver, callback context, completion count, result and failure meaning, cancellation and cleanup. Establish what effects can precede failure. A callback API does not prove a nonblocking invocation; timeout, notification removal and provider cancellation are different events. Record each provider type consumed outside the adapter. Use version-matched provider documentation for guarantees; code comments establish only source intent. |
| Identities | Mint site → carrier → check site → drop site. For each consumer that acts on a result, record which identity it compares and against what, and whether the id is a distinct type or a raw string or int. For replicated facts, record the transmitted representation, its version field and the reconciliation site. |
| States and transitions | Writer → authoritative inputs → stored or derived value → each consumer → update, invalidation, teardown. Record every variable that answers a runtime question, including booleans and nullables. Separate combinations the type excludes from those a check prevents. For a label such as ready or purchased, record the event that sets it and the evidence that event carries. |
| Action gates | For each action, the states in which callers invoke it and who, if anyone, refuses it elsewhere: the type, the state owner, a caller check, or nothing. Record where each decision is made and whether a second site decides the same rule. |
| Lifetimes | Acquire → owner → release → release trigger, for each resource. Record the ownership form: unique or scoped, shared, region, undecided. Record each exit path with no release. Distinguish requested cleanup from confirmed quiescence. |
| Interrupting events | For each event in scope the lens names, what the code does to each in-flight operation, and the continuation that carries the effect. Mark an effect unknown because its caller is outside the snapshot as a limit. |
| Failure taxonomy | Source → detector → classification → handler owner → resulting state → user-visible outcome → retry, reset or stop. Record every many-to-one mapping and which consumers read the merged value, where the mapping lives, and any consumer that matches on strings. Record each entry path to trusting code and its validation owner. |
| Concurrent handoffs | Producer context → handoff → consumer context → final consumer. Payload, publication order, synchronization, stale fencing, retention and release. Walk synchronous completion, replacement and teardown windows. For a per-frame or per-packet path, record each allocation, lock and external call on it, read from code. |
| Time and constants | For each interval or constant: unit, clock domain, origin time, who chose it, why that magnitude, and the consumer. For each literal in core logic, record whether the fact it stands for is fixed by a named contract or varies by platform, device, environment, user configuration or input; where the actual value is read, if anywhere; and which tests exercise a value other than the literal. Carry an observation's original time through every queue to its final consumer and note any step that replaces it with receipt time. Record constants that must agree and are written separately. |
| Wrappers | For each wrapper or decorator, the capabilities the composition consumes and whether each reaches the inner owner through the actually installed binding, and whether the member is abstract, virtual or defaulted. A forwarding claim in a comment is not forwarding. |
| Diagnostics | When the diagnostics lens is selected, read [logging.md](logging.md). |

Stop a trace when the row's relationship and its consumer outcome are explained, or when you can name the specific unresolved boundary. If evidence cannot establish a claim, record the missing fact and which row it leaves open. Do not fill it with an assumption or launch an experiment.

## 3. Write the model

Start with an orientation with these slots: target, revision and access method; local changes; purpose, governing obligations and historical proposals, kept apart; conflicts between supplied rules; boundary and exclusions; selected lenses; the ordinary path in a paragraph; the evidence legend; and checks performed, filled in at step 5. Label every row as source-established, provider contract, measured or unresolved. Source-established means expressed in code, not confirmed at runtime.

Then one section per model area, each a table with an Enforcement column and a Sources column pinned to the revision:

1. **External contracts.** One row per external operation.
2. **Identities and correlation.** One row per identity and one per consumer that acts on a result.
3. **States and transitions.** One row per state root, with legal transitions and derived views. List roots that are meant to be mutually exclusive.
4. **Action gates.** Action by state matrix: allowed, forbidden, undefined, and the enforcer.
5. **Lifetimes.** One row per resource.
6. **Interrupting events.** One row per event per in-flight operation.
7. **Failure taxonomy.** One row per failure source.
8. **Concurrent handoffs.** One row per handoff.
9. **Time and constants.** One row per interval or constant.
10. **Wrappers.** One row per wrapper per consumed capability.
11. **Diagnostics**, when selected, in the shape logging.md defines.

A row earns its place when a lens could use it: it constrains a design choice or shows a combination reachable or excluded. Do not inventory every field or every call. Name a component's role before its symbol. Explain each relationship where it is needed; when two sections need the same fact, repeat the relationship and keep its provenance consistent. Never write "see another section". Replace an empty section with one line stating what was inspected. Write raw traces, excerpts and hashes to a separate appendix file beside the model; they verify the model and are not given to the design stage.

## 4. Couple

Add a section **Collapses and overlaps**. For each selected design lens, add the rows its Couple row line names, drawn from its model sections. Each row cites the model rows it rests on, names the lens, and states the consequence the facts permit, not a remedy. A lens with no instance gets no row; do not pad the section.

## 5. Check before handoff

Read each section with only the orientation. Can a reader name the owners, the relationship, the enforcement and the limits without another section or the source? If not, add the relationship locally.

Reconcile delegated areas with the source on both sides of their boundary. Check repeated facts, exact operation names, owners and completion claims there; do not repeat a finished audit to certify the report. For a wrapper claimed transparent, show which consumed capabilities reach the inner owner. For a timed fact, show the retained origin and its final consumer. For an operation named as output only, account for its actual side effects. Check client, server and platform variants separately when their contracts differ.

Finish when every section has its rows or a specific unresolved limit, every row has its enforcement, and the couple section cites only existing rows and selected lenses. Fill the orientation's checks slot with the checks actually performed. Keep skill-trial observations out of the model.
