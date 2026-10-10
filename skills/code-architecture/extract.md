# Extract the constraint model

Write a code-free account of the subsystem's constraints for agents that will not read the source. State facts; do not judge the design or propose changes.

## 1. Pin the source, the boundary and the lenses

Read project instructions, the subsystem's goals and rulings, and [lenses.md](lenses.md). Select lenses by its Selection rule. Identify the version control system from the workspace before recording revision and local changes (a git commit, a Plastic changeset and branch, a Perforce changelist); one system's metadata can sit in another's workspace. Record the inspected revision, relevant local changes, access method and excluded areas. For unversioned source, record content hashes of inspected files. Separate current obligations, historical proposals and source behavior: a tracker issue's completion or definition-of-done section states the obligation, and what shipped is in dated comments and revision history. Preserve a conflict between supplied rules instead of choosing one.

Bound the subsystem by the producers of the requested outcome, not by the component where a symptom appeared. Name the consequential paths an explicit narrower request excludes.

## 2. Collect the evidence

Brief every delegate at once, one per section group. Each delegate reads the whole bounded source for its sections and writes their rows with provisional ids; the extractor assigns final ids when it merges. The states and gates delegate names each writer of a root by routine; the extractor replaces those names with `PR` ids at merge. The diagnostics delegate bounds its coverage map to the flows the orientation's ordinary path names. No delegate waits for another. If delegation is unavailable, write every section yourself and disclose the limit in the orientation.

For each model section, find the public contracts, actual callers, decision sites, stored values and external operations that supply its rows. Read declarations and callers both. Where client, server, platform or build-configuration variants change a row (conditional compilation, platform modules, release versus development builds, editor versus packaged), write the row per variant. Callers and bindings outside text source (visual scripts, data assets, config files, delegates bound in an editor, reflection) and content not present in the workspace are excluded areas unless inspected; name them in the orientation. Keep the working inventory in notes; it is not a report artifact.

For every row, record how the fact is enforced today: by type, at a single gate, by a caller check, by convention, or not at all. If the enforcement exists only in some build configurations (an assert, a debug-only or editor-only path), record the configurations where it holds. This is the current form the compare stage judges against the design.

Use these traces:

| Section | Trace |
| --- | --- |
| Provider routine effects | For every provider routine that the subsystem's own code calls, overrides or forks directly, and for every provider callback into the subsystem's objects (a notification the provider calls on the component or actor: a volume change, an overlap, a teleport, a mode change, a base change), read the routine's implementation at the selected revision. Record the state roots it writes on entry, during its work and on exit, and the routines it calls that write more; those callees appear inside the caller's row, not as rows of their own. When the provider is a fork of an upstream release, the row says whether the routine differs from upstream, read from the fork's history, so a project edit inside the provider is not recorded as provider contract. If the subsystem calls no provider routine, the table is one line: `PR: none, because <what was inspected>`. A setter whose entry routine writes other roots, a helper that changes a value it was not called for, a change that triggers a second action: these writes belong to the subsystem's state roots as much as its own. One `PR` row per routine. A routine named only in a header or comment is unresolved. |
| External contracts | Inspect invocation separately from completion: blocking evidence, progress driver, callback context, completion count, result and failure meaning, cancellation and cleanup. For each timeout, what it measures (whole operation, one attempt, inactivity, frames or ticks) and which phases fall outside it. Establish what effects can precede failure, including attempts the provider retries internally before it reports. A callback API does not prove a nonblocking invocation; timeout, notification removal and provider cancellation are different events. Record each type from an adapted provider (an SDK, service or platform API the subsystem wraps) consumed outside the adapter; the engine or framework the whole project is built on is not an adapted provider. Read the provider implementation the build actually selects for each supported platform and configuration (the transport, driver, platform module or subsystem chosen by configuration, defines or build rules), not its headers or type declarations; a declaration comment establishes only intent. When only headers or binaries ship, the fact is provider contract or unresolved. Read version-matched provider documentation and the pages it links to before marking a provider fact unresolved. |
| Identities | Mint site → carrier → check site → drop site. For each consumer that acts on a result, record which identity it compares and against what, and whether the id is a distinct type or a raw string or int. For replicated facts, record the authoritative writer, the transmitted representation, how order is established (version, sequence, or the transport's documented ordering) and the reconciliation site. |
| States and transitions | Writer → authoritative inputs → stored or derived value → each consumer → update, invalidation, teardown. Every writer: the subsystem's own and each `PR` row that writes the root, cited by id. Record every variable that answers a runtime question, including booleans and nullables. Separate combinations the type excludes from those a check prevents. For a label such as ready or purchased, record the event that sets it and the evidence that event carries. |
| Action gates | For each action, the states in which callers invoke it and who, if anyone, refuses it elsewhere: the type, the state owner, a caller check, or nothing. Record where each decision is made and whether a second site decides the same rule. |
| Lifetimes | Acquire → owner → release → release trigger, for each resource. Record the ownership form: unique or scoped, shared, region, collected with a named strong holder, undecided. Record each exit path with no release. Distinguish requested cleanup from confirmed quiescence. |
| Interrupting events | For each event that can arrive while work is in flight (owner teardown and application shutdown; user, session or account change; loss of connectivity; suspend or focus loss; replacement by a newer request; runtime events such as level travel or the end of a play session), what the code does to each in-flight operation, and the continuation that carries the effect. Mark an effect unknown because its caller is outside the snapshot as a limit. |
| Failure taxonomy | Source → detector → classification → handler owner → resulting state → user-visible outcome → retry, reset or stop. Record every many-to-one mapping and which consumers read the merged value, where the mapping lives, and any consumer that matches on strings. Record each entry path to trusting code and its validation owner. |
| Concurrent handoffs | Producer context → handoff → consumer context → final consumer. Payload, publication order, synchronization, stale fencing, retention and release. Walk synchronous completion, replacement and teardown windows. For a per-frame or per-packet path, record each allocation, lock and external call on it, read from code. |
| Time and constants | For each interval or constant: unit, clock domain, origin time, who chose it, why that magnitude, and the consumer. For each literal in core logic, record whether the fact it stands for is fixed by a named contract or varies by platform, device, environment, user configuration or input; where the actual value is read, if anywhere; and which tests exercise a value other than the literal. Carry an observation's original time through every queue to its final consumer and note any step that replaces it with receipt time. Record constants that must agree and are written separately. |
| Wrappers | For each wrapper or decorator, the capabilities the composition consumes and whether each reaches the inner owner through the actually installed binding, and whether the member is abstract, virtual or defaulted. A forwarding claim in a comment is not forwarding. |
| Diagnostics | When the diagnostics lens is selected, read [logging.md](logging.md). |

Stop a trace when the row's relationship and its consumer outcome are explained, or when you can name the specific unresolved boundary. If evidence cannot establish a claim, record the missing fact and which row it leaves open. Do not fill it with an assumption.

## 3. Write the model

Start with `## Orientation` and these `###` subsections: Target, revision and access; Local changes; Purpose and obligations, with historical proposals kept apart; Constraints (performance, memory, threading, with their source, or "none stated"); Conflicts between supplied rules; Boundary; Excluded areas; Selected lenses; Ordinary path, in a paragraph; Evidence legend; Checks performed, filled in at step 5. Tag every row `[S]` source-established, `[P]` provider contract, `[M]` measured or `[U]` unresolved. Source-established means expressed in code, not confirmed at runtime.

Then one section per model area, headed `## 1. External contracts` through `## 10. Wrappers` and `## 11. Diagnostics` when selected. Each is a table whose rows start with an id, the section's prefix and a number, and whose columns include Enforcement and Sources. Prefixes: `O` obligations and rulings in the orientation, `X` external contracts, `PR` provider routines, `ID` identities, `S` states, `A` action gates, `L` lifetimes, `N` interrupting events, `F` failures, `Q` concurrent handoffs, `C` time and constants, `W` wrappers, `D` diagnostics, `K` collapses. `I`, `E` and `P` belong to the design; `H` to the synthesis. Enforcement starts with one of `type`, `gate`, `check`, `convention`, `none`, and names the enforcer; Sources pins file and lines at the revision. Ids are the handles every later stage cites, so they do not change after the model is written.

1. **External contracts.** One row per external operation, and the `PR` table: one row per provider routine the subsystem calls, overrides or forks, with the state roots it writes.
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

A row earns its place when a lens could use it: it constrains a design choice or shows a combination reachable or excluded. Do not inventory every field or every call. Name a component's role before its symbol. Explain each relationship where it is needed; when two sections need the same fact, repeat the relationship and keep its provenance consistent. Never write "see another section". An empty section has one line: `none, because <what was inspected and found nothing>`. Write raw traces, excerpts and hashes to a separate appendix file beside the model; they verify the model and are not given to the design stage.

## 4. Write the K rows

Add `## Collapses and overlaps`, a table of `K` rows: id, lens slug, the model rows it rests on by id, and the consequence the facts permit, not a remedy. For each selected design lens, add the rows its K row line names, drawn from its model sections. A lens with no instance gets no row; do not pad the section.

## 5. Check before handoff

Read each section with only the orientation. Can a reader name the owners, the relationship, the enforcement and the limits without another section or the source? If not, add the relationship locally.

Reconcile the group drafts: one id per fact, one description, the same operation names, owners and completion claims in every section that repeats a fact. Replace each writer named by routine in the states rows with its `PR` id. Do not repeat a finished audit to certify the report. For a wrapper claimed transparent, show which consumed capabilities reach the inner owner. For a timed fact, show the retained origin and its final consumer. For an operation named as output only, account for its actual side effects.

Then run three sweeps and record each result in Checks performed:

1. Every provider routine named in a Sources cell of sections 1, 3, 4 or 10 has a `PR` row, or a line saying why it writes nothing.
2. Every state root in section 3 lists each `PR` row that writes it among its writers.
3. `python3 scripts/check_artifacts.py model <model.md> --lenses <lenses.md>` passes. It checks the headings, ids, tags, Enforcement tokens, the `PR` table and that `K` rows cite existing rows and lens slugs.

Finish when every section has its rows or a specific unresolved limit, every row has its enforcement, and the three sweeps are recorded. Keep skill-trial observations out of the model.
