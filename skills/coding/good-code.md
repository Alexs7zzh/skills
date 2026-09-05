# Good code

Properties of the resulting code, used in writing, review, and diagnosis. Read Values for every judgment and the lenses whose mechanisms the work touches. The route sets the scope; these properties do not expand it. Sweeps return the applicable objects under Enumerate.

**Risk surfaces:** concurrency, a lock-free or transition protocol, ownership or lifetime, a realtime path, externally delivered data.

## Values

- **Defense follows ownership.** Validate where uncontrolled input enters an owned boundary. Inside a controlled mechanism, prefer preventing misuse or fixing its call site. Before removing a guard, establish which contract excludes the case and who enforces it. Partial defense can earn its cost by reducing a concrete failure's likelihood or consequence.
- **Complexity lives behind the boundary that owns the failure.** A subsystem recovers under its own recorded policy and shows its callers only the states they must react to. Size a design by what crosses that boundary, the states other modules see and the dependencies between them, never by line count. Complexity inside is earned when it deletes a bug class or owns a failure the caller must not see. Complexity for a future nobody asked for is not.
- **Constants carry their reason.** A hardcoded value describing anything external, a rate, size, limit or timeout, states its source at the declaration: contract, measurement, or derivation. It is a claim about someone else's system, so name who guarantees it; the provider's own docs usually answer in one read.
- **One authoritative home per fact.** Prefer explicit states over combinations of flags and enforce invariants at the owner. Derived representations can serve different boundaries; a runtime validator and static types do different work. Avoid maintaining the same decision independently in multiple places.
- **Ownership makes lifetime clear.** Prefer scoping resources to their owner over coordinating cleanup across callers. Shared ownership needs a defined lifetime and release policy. Scattered validity checks are a cue to investigate that policy, not proof that it is absent.
- **A reader can reason locally.** The operation's contract, state changes, ownership, and failure outcome are clear from its structure and named interfaces. A quality finding identifies the hidden dependency or split knowledge that makes a concrete maintenance task difficult. An abstraction earns its place when it reduces that burden, even with one caller.
- **Logic lives at the boundary that owns its obligation.** Apply the deletion test to helpers, wrappers, modes, checks, flags, and dependencies: what user goal, ruling, system contract, depended-on behavior, or maintenance task becomes worse without it? Investigate that obligation per SKILL.md, Authority. Duplicated work reappearing at callers can justify a helper. If deletion preserves those obligations and reduces reasoning or maintenance cost, recommend it. An undiscovered reason is uncertainty to investigate, not proof of redundancy; speculative future needs do not justify a mechanism.

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

**Failure paths.** Judge recovery against the feature's intended experience and contract. An optional enhancement should normally preserve the capability it improves when unavailable; a feature that forbids unsafe continuation may intentionally stop it. Every fallible operation has a designed outcome and leaves defined state. The owning policy absorbs the failure or makes it visible through a channel the caller understands. A normal-looking result is wrong when it conceals an unmet contract, not when a deliberate fallback fulfills it. For each error branch, ask who learns, which state remains, and what happens next. Error context should suffice to investigate the failure without reconstructing scattered logs; use shared state reporting where it reduces that work.

**Structural quality.** Investigate self-declared gates, repeated knowledge, and defenses that do not achieve their stated purpose using the deletion test. Establish whether they own a distinct enforcement boundary, reduce a relevant risk, or simplify a maintenance task before judging them. An ad-hoc conditional in an unrelated flow suggests misplaced policy; name the boundary it belongs to. Growth calls for decomposition when distinct responsibilities or invariants become hard to reason about, not at a line-count threshold. Look for a reframe that removes branches or layers while preserving obligations. A quality finding names a concrete future cost, not a taste.

**Test design.** Expected results need a source independent of the implementation decision under test. A test that computes the answer the same way can repeat the defect. Name the symmetries the generator imposes, such as zero-mean signals, identical channels, on-grid values, or design-unit parameters; inspect omitted dimensions that matter to the claim. A threshold assertion without its baseline comparison asserts one side of a trade. Tests tied to internal shape can break on a behavior-preserving refactor. Choose what to validate per findings.md, Evidence; do not add tests that merely restate the implementation.

## Enumerate

Across the scoped sweeps, account for each applicable object below, with its site, claim, and evidence or gap. Partition the objects between sweeps; each sweep need not repeat the whole list:

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
