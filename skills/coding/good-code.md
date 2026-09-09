# Good code

Properties of the resulting code, used at every level in writing, review and diagnosis. Read Values and the lenses whose mechanisms the work touches. Apply them within the requested scope; they do not select a level, require a team, or turn a direct edit into an exhaustive sweep. Enumerate is a coverage aid for a requested investigation or review, not a mandatory report for each change.

## Values

- **Defense follows ownership.** Validate where uncontrolled input enters an owned boundary. Inside a controlled mechanism, prefer preventing misuse or fixing its call site. Before removing a guard, establish which contract excludes the case and who enforces it. Partial defense can earn its cost by reducing a concrete failure's likelihood or consequence.
- **Interfaces express capabilities, not internal machinery.** Expose the intent, observations, and choices a caller needs. Keep sequencing and recovery inside the owner when callers cannot usefully control them. Make limits and required caller action visible; keep diagnostics available without making ordinary callers orchestrate the internals. A small interface does not excuse unnecessary internal states, layers, or protocols.
- **Constants carry their reason.** A hardcoded value describing anything external, a rate, size, limit or timeout, states its source at the declaration: contract, measurement, or derivation. It is a claim about someone else's system, so name who guarantees it; the provider's own docs usually answer in one read.
- **Store decisions and observations; derive their consequences.** For each stored field, name the actor or process that decides or observes it, or the authoritative inputs from which it is computed. Updates that clear, invalidate, or propagate another field are a cue to check whether both store the same fact. Derive consequences by default. For a retained snapshot or materialized value, name the requirement it serves, its consistency contract, and the single boundary that maintains that contract, including permitted staleness or the historical point represented. Check every write path against that boundary; a cache or index is not exempt merely because it has that name.
- **Model the runtime question, not the descriptive vocabulary.** For each enforced state or mode, name the runtime question and the consumer that uses its answer. For protocol states, name the actor or external process whose decisions or observed transitions they represent. Prefer explicit states over flag combinations for those decisions and observations, not for consequences already derived from them. Kinds, labels and phases without a behavioral consumer remain useful content for readers, not a workflow to enforce. Branch counting does not justify a concept; when a mode multiplies rules, identify the distinct contracts that require those variants.
- **Share a derived view only across compatible questions.** Name each consumer and what a missing or extra item would cause it to do. Consumers may share a view when its meaning and inclusion guarantees meet each contract. A presentation filter cannot also gate completion or trigger notifications if it can omit work those consumers must see. When the guarantees differ, separate the policy views while sharing the authoritative facts and calculations they actually have in common.
- **Ownership makes lifetime clear.** Prefer scoping resources to their owner over coordinating cleanup across callers. Shared ownership needs a defined lifetime and release policy. Scattered validity checks are a cue to investigate that policy, not proof that it is absent.
- **A reader can reason locally.** The operation's contract, state changes, ownership, and failure outcome are clear from its structure and named interfaces, without reconstructing unrelated history. Judge the subsystem and callers together: concepts to learn, states to track, dependencies, required call ordering, and places to change. A quality finding names the concrete task made difficult. Line counts and branch counts prompt investigation; they are not verdicts. An abstraction can earn its place with one caller, and a longer operation can be clearer than a chain of fragments.
- **A mechanism earns its cost.** Apply the deletion test to helpers, wrappers, modes, checks, flags, and dependencies: what user goal, ruling, system contract, depended-on behavior, or maintenance task becomes worse without it? Follow where the responsibility goes; fewer lines in one place do not help if callers inherit coordination or duplicate policy. Investigate the obligation per SKILL.md, Authority; a missing spec sentence is not proof that none exists. Then establish how the mechanism contributes and whether a simpler alternative preserves the obligation at lower overall cost. Remove, replace, or relocate it when that improves the design. A plausible future use is not enough to keep it; neither is a named requirement enough to justify every mechanism proposed for it.

## Lenses

**Concurrency and async.** First ask whether ownership or handoff can remove shared mutation. When coordination remains, choose a proven mechanism against the actual latency, blocking, and lifetime constraints. A lock-free crossing needs a reason beyond avoiding a small lock. Prefer events when their delivery contract covers the required transitions; polling or reconciliation can be appropriate when that is the available contract. Mechanisms:
- Transition windows nobody observes. A reset keyed on "the next callback sees state X" never fires when the transition completes between callbacks. A producer that passed its gate before the transition still publishes into the successor's space.
- Stale-fencing that covers the core but not the outermost transport edge: RPC glue, HTTP wrapper, SDK trampoline.
- Completion callbacks that can fire synchronously from the call that arms them. Publish the state the handler reads before dispatch.
- Callbacks delivered on provider threads. Verify the delivery contract before mutating owned state.
- Order-dependent async writes share one serialization lane, or they reorder.
For every protocol passed as clean, name the interleaving windows walked and why the depended-on observation is guaranteed.

**Ownership and lifetime.** Mechanisms:
- A subscription whose mirror removal is missing, on a source that outlives the subscriber.
- A weak reference resolved once, the raw handle stashed across an async gap.
- Pooled or recycled entries handing back a stale instance. Create before remove, or reset on acquire.
- Async completion assuming a live receiver.
- Teardown running on the dispatch stack of the thing being torn down.

**State and lifecycle.** Mechanisms:
- Events arriving in unanticipated states, especially during init and after teardown.
- Failure paths that return without transitioning, leaving in-progress forever.
- Retry residue from the previous attempt.
- Requested state confused with observed state. For a long-lived capability, intent can remain enabled while availability changes. Turning it off cancels recovery; a late completion must not turn it back on.
- Every waiting state keeps a live resolver. Every retry loop keeps a durable brake whose accounting survives the churn the loop itself causes.

**Performance.** Judge every loop at production scale. The shipping default path is first-class even when the request centers the new code. Cost the steady-state path of hot loops yourself, by operation count or compiled replica. A benchmark is evidence only for the path it exercised, and early-outs make the common case the unmeasured one. Scale dev-machine numbers to the weakest supported hardware. Multiply inner O(N) sweeps inside per-callback loops against the budget.

**Data flow and invariants.** Mechanisms:
- Quantization constants: a grid with tolerance smaller than its step is blind between grid points.
- A validation fed the validator's own constants is tautological and can never fire.
- Fabricated success-shaped results. "Done" notifications emitted before durability.
- Write-only fields, a documented but unimplemented contract.
- Comparators ignoring fields consumers react to.
- Optional interface methods, defaulting to no-op, for capabilities the system requires in every reachable state.
- Validate-then-trust boundaries: review the validator for completeness against every assumption the trusting phase makes. Missing-guard findings inside the trusting phase are noise by design.

**Failure paths.** Place recovery where the intended experience, necessary knowledge, and control meet, not simply where the fault originated. Fix defects in code you control. For external faults, establish what the application can usefully restore and what requires a user, provider, or environment change. Handling the consequence does not require repairing the outside system. An optional enhancement should normally preserve the capability it improves when unavailable; a feature that forbids unsafe continuation may intentionally stop it.

Every fallible operation leaves a defined state and outcome. An exception, error return, or log is a delivery mechanism, not a recovery policy. For each error branch, ask who learns, which state remains, and what happens next. Distinguish active recovery from waiting on a prerequisite or user action. A normal-looking result is wrong when it conceals an unmet contract, not when a deliberate fallback fulfills it. Retain enough diagnostic context to investigate without reconstructing scattered logs or exposing every internal error as caller policy.

For each recovery loop, name the observation, changed prerequisite, or safe retry that can make progress. Choose a deliberate retry scope so independent layers do not multiply attempts or side effects. Persistent recovery must still respect cancellation and resource limits per Enumerate; it does not promise eventual success when prerequisites remain unavailable. A violated internal invariant needs investigation, not an indefinite retry loop that hides it.

**Structural quality.** Investigate self-declared gates, repeated knowledge, and defenses that do not achieve their stated purpose using the deletion test. Establish whether they own a distinct enforcement boundary, reduce a relevant risk, or simplify a maintenance task before judging them. An ad-hoc conditional in an unrelated flow suggests misplaced policy; name the boundary it belongs to. Growth calls for decomposition when distinct responsibilities or invariants become hard to reason about. Look for a reframe that removes branches or layers while preserving obligations. A quality finding names a concrete future cost, not a taste.

**Test design.** Expected results need a source independent of the implementation decision under test. A test that computes the answer the same way can repeat the defect. Name the symmetries the generator imposes, such as zero-mean signals, identical channels, on-grid values, or design-unit parameters; inspect omitted dimensions that matter to the claim. For stateful systems, test changes of responsibility, inputs, scope and cancellation during ongoing work, not only starting in each supported mode. A queued action is not proven usable until its actor can perform it under the same facts; a waiting state needs a reachable resolver, not just a nonempty field. A threshold assertion without its baseline comparison asserts one side of a trade. Tests tied to internal shape can break on a behavior-preserving refactor. Choose checks for the claim; deep investigations use evidence.md's retained evidence procedure. Do not add tests that merely restate the implementation.

## Enumerate

When sweeping a requested review or investigation, use these objects to check coverage within that scope. In deep work, retain significant claims and gaps with their sites and evidence; normal work need not produce an inventory. Partition the objects between sweeps rather than repeating the list:

- every constant with physical meaning: its source in a contract, negotiation, derivation, or measurement; inspect real inputs or logs when the claim depends on delivered values
- every assumption about externally delivered data
- every atomic, lock-free or transition protocol
- every callback's delivery context and reachable teardown
- every hot loop on a realtime path: worst case against budget, and which path the recorded benchmarks measured
- every fallible operation's failure outcome: who learns and through which channel, and its debuggability
- every retry, recovery loop, or queue that can leave a user stuck: its progress or termination policy, cancellation, and the visible state when it cannot proceed. Persistent recovery needs an explicit purpose and bounded resource use; a finite attempt count is not the only valid policy
- every doc and coverage claim. Grep the whole feature doc for prose still asserting behavior the change deleted.
- every consumed-library setting that differs from its provider default or stated usage: establish which project obligation it serves and whether the provider supports that use; a missing written justification starts investigation
- every symmetry the test generators impose
- every place where a consumed API's result gates correctness: read one level into the provider and confirm it can distinguish the outcomes the consumer branches on
- every check, flag, mode, config key, dependency, and single-caller abstraction the change adds: apply the deletion test in Values, retaining its obligation or the evidence supporting removal
