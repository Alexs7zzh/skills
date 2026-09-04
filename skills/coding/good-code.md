# Good code

Properties of code at rest, independent of any task. Read the lenses a change touches, in any review, and before writing on a risk surface. Each lens states its value, then the mechanisms that produce its bug class. Sweeps return the objects listed under Enumerate.

**Risk surfaces:** concurrency, a lock-free or transition protocol, ownership or lifetime, a realtime path, externally delivered data.

## Values

- **Defense follows ownership.** Guards belong at boundaries the component does not control. Inside a controlled mechanism, make misuse unrepresentable or fix the call site. A guard against a case the contract excludes is itself a restructure candidate.
- **Complexity lives behind the boundary that owns the failure.** A subsystem recovers under its own recorded policy and shows its callers only the states they must react to. Size a design by what crosses that boundary, the states other modules see and the dependencies between them, never by line count. Complexity inside is earned when it deletes a bug class or owns a failure the caller must not see. Complexity for a future nobody asked for is not.
- **Constants carry their reason.** A hardcoded value describing anything external, a rate, size, limit or timeout, states its source at the declaration: contract, measurement, or derivation. It is a claim about someone else's system, so name who guarantees it; the provider's own docs usually answer in one read.
- **One authoritative home per fact.** Illegal states unrepresentable. Result types express every terminal state. One explicit state beats a pile of booleans.
- **One owner, lifetimes forming a tree**, scoping preferred over managing. Scattered validity checks mean ownership was never decided.
- **Work is event-driven rather than polled.**
- **Logic lives in its canonical layer.** Apply the deletion test to every helper, wrapper or mode: delete it mentally, and if the complexity vanishes it was a pass-through worth removing, while complexity reappearing at N call sites means it earns its keep.

## Lenses

**Concurrency and async.** Rank structure over mechanism: no shared mutable state > single writer or wholesale handoff > one battle-tested lock-free crossing > minimal locks. Mechanisms:
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

**Failure paths.** An enhancement's failure degrades to the pre-feature baseline and never below it, so a quality improvement whose unavailability disables the capability it improves inverts its own goal. Flag any failure branch that does. Every fallible operation has a designed outcome, a defined state rather than "an error is logged". A failure is absorbed under recorded policy or crossed to the caller as data. "Detected, logged, returned a normal-looking value" is a provider Bug even when current callers survive. For each error branch, ask who learns and through which channel. Diagnosability is reviewable construction: self-sufficient error lines, and complex subsystems dumping state through one function invoked from error entries.

**Structural quality.** Changed code only, never pre-existing code. New ad-hoc conditionals inserted into unrelated flows are design problems rather than nits, so name the abstraction, state machine or policy the logic belongs in. A diff that grows a file past its current order of magnitude asks for decomposition first. Look for the reframe that makes whole branches or layers disappear while preserving behavior. A quality finding names a concrete future cost, not a taste.

**Test design.** Tautological tests pass by construction, with expected values computed the way the code computes them or taken from the code's own constants. Expected values come from an independent source of truth. Parameter spaces expressed in the design's own units cannot falsify the design's own assumption. Name the symmetries the test generator imposes, such as zero-mean signals, identical channels, on-grid values, or design-unit parameters; each one is a domain dimension the suite cannot falsify, and an open row. A threshold assertion without its baseline comparison asserts one side of a trade. Implementation-coupled tests break on refactor without behavior change.

## Enumerate

Every sweep returns these, each as an obligation row with file:line and the claim it carries:

- every constant with physical meaning: who guarantees it, by contract, negotiation or measurement, and check real logs
- every assumption about externally delivered data
- every atomic, lock-free or transition protocol
- every callback's delivery context and reachable teardown
- every hot loop on a realtime path: worst case against budget, and which path the recorded benchmarks measured
- every fallible operation's failure outcome: who learns and through which channel, and its debuggability
- every retry, recovery loop, or queue that can leave a user stuck: the line that limits how many attempts it gets, and the state the user lands in when it gives up. No limit, or no defined give-up state, is a finding.
- every doc and coverage claim. Grep the whole feature doc for prose still asserting behavior the change deleted.
- every consumed-library setting that differs from its provider default or stated usage, where every deviation is a deliberate-choice claim: verify its recorded justification or file it
- every symmetry the test generators impose
- every seam where a consumed API's result gates correctness: read one level into the provider and confirm it can distinguish the outcomes the consumer branches on
