# Lenses

A lens is an invariant, the code form that enforces it, the bug class that form removes, and the couple row extraction adds when the form is absent. Design uses the code forms. Compare tags each divergence with its lens slug and finds its evidence in the model sections the lens names. A lens that cannot name a code form is a readability lens, kept apart and pruned by record in `evals/lens-ledger.md`.

Every stage honors a lens's "Not a finding" line.

## Selection

All design lenses apply to every run. Add diagnostics when the request names logging, telemetry, severity or monitoring, or the goals state a monitoring obligation. Add readability lenses only when the user asks for them. Extraction records the selection in the orientation; later stages read it there.

## Checking a design

A design's own structures can permit the bug classes the lenses remove. Check each encoding for these shapes before accepting it:

- A decision value consumed after its fact can change: an admission, eligibility or authorization result used by later work (a retry, a deferred or batched job, a later tick) without re-checking the facts it was decided from. authority.
- A lease where scoped ownership would do: a time-bounded claim on work that a transaction, a version check, a provider's own deduplication or a single owning thread already makes exclusive. lifetime. A lease kept only to throttle concurrent work or cost, and documented as such, is not this shape; check that no correctness claim rests on it.
- External work kept inside an owner that then needs a fence: a queue, dispatcher or worker task that makes the provider call itself instead of handing it to the owner that already fences it. identity, policy-owner.
- A mechanism copied from another owner without that owner's obligation: it adds states and recovery work that protect nothing. present-obligation.
- A bound computed from a mechanism whose meaning is a premise: a worst case from timeout and retry settings before the provider code shows what the timeout measures, a window from an undocumented lag. external-contract, constants.
- A provider recovery the provider does not document for this case: a retry, resubmission or new request key after an outcome the provider reports as unknown, justified by documentation of a different case. Cite the guidance for this case or list the recovery as a premise. external-contract.
- A rule generalized across kinds the provider treats differently: a recovery safe for one operation kind applied to all. external-contract.
- A level claimed that the form does not reach: a check offered as a gate, a convention or comment offered as a type. state-gate.

## Design lenses

### state-gate: actions are a function of state

- Invariant: an action runs only in the states that permit it, and one owner decides.
- In code: one state owner through which every action passes; transitions in one method; callers ask the owner to act and never test a flag and then act. A single-flight or uniqueness invariant across concurrent callers (threads, processes, requests) is an atomic check-and-act at the owner: a unique key or locked row in a store, a compare-and-swap, a lock held across both check and act, or one owning thread. A read followed by a separate write is a check, not a gate.
- Bug class removed: the action applied in the wrong state. Purchase started twice, join sent while leaving, send after close.
- Couple row: an action reachable in a forbidden or undefined cell of the gate matrix, with the absent enforcer.
- Model sections: action gates, states and transitions.
- Not a finding: an action legal in every state, or a gate the type already enforces.

### one-root: mutually exclusive facts share one variable

- Invariant: facts that cannot be true together are stored as one value.
- In code: an enum or sum type instead of parallel booleans and nullables; a state's data lives on its own case, so data for the wrong case cannot exist; derived views are pure getters over the root.
- Bug class removed: two flags both set; a state that exists only because two variables disagree.
- Couple row: states meant to be exclusive that are stored in separate roots and can disagree.
- Model sections: states and transitions.
- Not a finding: independent facts that legitimately combine. Payment, access and recovery of one purchase are three facts, not one state.

### authority: one writer per fact, and copies declare their lag

- Invariant: each fact has one writer; every copy names its purpose and permitted lag.
- In code: the field is private to its owner with no external setter; others get a read-only view or a pure getter; a retained copy is a distinct type that names its purpose. A fact that several sources can each supply (access from several purchases, a permission from several grants) is stored as the set of contributions and derived per read, never as one flag.
- Bug class removed: two writers racing on one fact; a copy acted on as current beyond its permitted lag; revoking one contributor revokes what the others still supply.
- Couple row: a fact with more than one writer, or a copy whose consumer treats it as current with no stated lag, or a flag that several sources set and any one of them clears.
- Model sections: states and transitions.
- Not a finding: a copy with a stated purpose and a lag the consumer honors.

### lifetime: lifetime is decided, not hedged

- Invariant: every acquired resource has one owner and one release on every exit path.
- In code: scoped ownership that releases on exit (RAII, using, defer, a disposable owner), so early returns and error paths release without a separate call. When the lifetime is not knowable, a region bounds it: an arena, a per-frame pool, a scope. Shared ownership only with a written reason. In a garbage-collected runtime the decided form is one strong reference from the owner and weak references elsewhere, and a non-memory resource (a device, session, registration, timer) still has an explicit release at the owner's end; collection is not release.
- Bug class removed: a leak on an error path; double release; use after release; shared ownership nobody decided.
- Couple row: a resource with no owner, more than one releaser, an undecided ownership form, or an exit path with no release.
- Model sections: lifetimes.
- Not a finding: shared ownership with a named reason; a release the owner's exit already guarantees; a collected object whose only strong reference is its owner's.

### interrupt: every interrupting event has a defined effect on in-flight work

- Invariant: each interrupting event in scope has a defined effect on every operation in flight.
- In code: a cancellation token threaded into every continuation; one owner method runs teardown in order with the steps private; a continuation that arrives after its owner is gone is refused at entry.
- Bug class removed: a callback into a dead owner; teardown during dispatch; work that outlives shutdown.
- Couple row: an interrupting event for which the code gives an in-flight operation no defined effect. An effect unknown only because its caller is outside the snapshot is a limit, not a couple row.
- Model sections: interrupting events, concurrent handoffs.
- Not a finding: an operation the owner awaits before teardown proceeds, when the provider guarantees completion.

### identity: correlation reaches the point of use

- Invariant: an operation acts only on the entity, request or generation it was started for.
- In code: typed ids and generations travel in the payload and are compared where the result is consumed; a result whose generation is not current is dropped there.
- Bug class removed: the result of request A applied to request B; a purchase credited to the wrong user; a late result applied after replacement; a reply matched by arrival order.
- Couple row: an identity minted but not compared at a consumer that acts on a result; a replaceable operation whose completion carries no generation.
- Model sections: identities and correlation, concurrent handoffs.
- Not a finding: a single-flight operation whose owner forbids overlap by state.

### external-contract: invocation is separate from completion

- Invariant: for every external operation the thread, blocking behavior, completion count and cancellation semantics are known or written as premises, and an adapted provider's types do not cross the adapter.
- In code: one adapter translates provider results into owned types; registration returns a handle and completion arrives once as a separate typed result; the domain holds no reference to the provider's types.
- Bug class removed: blocking the game thread on a call assumed asynchronous; double completion; a provider upgrade that ripples through the domain.
- Couple row: an external operation whose completion count, thread or cancellation behavior is unknown and unstated; an adapted provider's type consumed outside the adapter.
- Model sections: external contracts.
- Not a finding: a provider behavior the version-matched contract documents and the adapter honors; a type or call from the engine, framework or standard library the whole project is written against, whose contracts are recorded as rows but which needs no adapter.

### required-capability: a required capability cannot be defaulted away

- Invariant: a wrapper forwards every capability the composition relies on.
- In code: required members abstract, optional members virtual or default, so a missing forward fails to compile; the composition root takes the concrete chain by type.
- Bug class removed: the inherited no-op; the decorator that forwards most operations.
- Couple row: a consumed capability that does not reach the inner owner through the installed binding.
- Model sections: wrappers.
- Not a finding: a default the governing contract declares optional.

### time-origin: a timed fact keeps its origin

- Invariant: expiry, age and deadline are computed from the original observation time in its clock domain, through every queue and adoption step.
- In code: absolute timestamps in payloads with the clock domain in the type; the consumer computes remaining time at use.
- Bug class removed: a TTL restarted on receipt; an age measured from arrival; a deadline in the wrong clock.
- Couple row: a timed fact whose origin is replaced by receipt or drain time between producer and consumer.
- Model sections: time and constants, concurrent handoffs.
- Not a finding: a duration whose consumer is the producer's own clock with no queue between.

### failure-class: classify once at the owner, keep the distinctions

- Invariant: each failure is classified by the owner with the knowledge and control to respond, and every distinction a consumer needs survives translation.
- In code: an owned error type with cause; the provider-to-owned mapping in one table in the adapter; retry class and user-visible reason as separate fields; no string matching downstream.
- Bug class removed: two causes merged into one code, so retry or messaging is wrong for one of them; recovery attempted by a layer without the knowledge to choose it.
- Couple row: a failure merged with another before a consumer that needs them apart; a failure handled by a layer that lacks the knowledge to choose the response.
- Model sections: failure taxonomy.
- Not a finding: a merge no consumer needs undone.

### trust-entry: validate once at the owned entry

- Invariant: untrusted input becomes a trusted type at one boundary; downstream code takes the type.
- In code: a constructor that cannot produce an invalid instance; one entry that turns raw input into that type; private setters. On a server, every client-sent message or remote-call parameter is untrusted input.
- Bug class removed: an alternate entry that skips validation; the same check repeated with drift.
- Couple row: an entry path that reaches trusting code without passing the validation owner; a check repeated at a second non-boundary.
- Model sections: external contracts, identities and correlation.
- Not a finding: a guard at a second genuine trust boundary.

### truthful-outcome: a state advances only on its evidence

- Invariant: requested, acknowledged and confirmed are distinct states, and each is entered only when its evidence exists.
- In code: the transition takes the evidence as its parameter (the confirmation receipt, the completion result), so the state cannot be set without it.
- Bug class removed: entitlement granted on request; a callback treated as completion.
- Couple row: a label or state set before its evidence exists, with a consumer that acts on it.
- Model sections: states and transitions, failure taxonomy.
- Not a finding: a label whose consumers all use it with its actual meaning.

### policy-owner: a decision has one owner, and executors do not re-decide

- Invariant: a decision is made at one site; executors carry out decisions they receive.
- In code: the decision site returns a decision value; executors take it as a parameter and hold no copy of the rule; a required sequence runs inside one owner method with the steps private.
- Bug class removed: two sites deciding differently; a caller that forgets the required order.
- Couple row: a rule decided at more than one site, or an ordering only callers enforce.
- Model sections: action gates, failure taxonomy.
- Not a finding: an executor that branches on its own mechanism state; a safety switch deliberately re-read at every effect site, so a pause bites on work already admitted.

### replicated: cross-process facts have an authoritative writer

- Invariant: a replicated fact has one authoritative writer, a defined transmitted representation, and one reconciliation site.
- In code: a distinct predicted type that the authoritative update replaces; order carried explicitly (version or sequence) wherever a consumer depends on order the transport does not guarantee; reconciliation in one place.
- Bug class removed: split authority; atomicity assumed from a struct; order assumed from a serializer.
- Couple row: a replicated fact with two writers, or a consumer that depends on an order the transport does not guarantee (between two properties, a property and a remote call, two unreliable messages).
- Model sections: external contracts, identities and correlation.
- Not a finding: transient events the contract says are fire and forget; replicated state whose consumers need only the latest value.

### constants: a literal is fixed by a contract, or it is a parameter

- Invariant: every consequential value is either fixed by a named contract or read at runtime from the source that determines it. Writing a literal is a decision that the fact does not vary; the decision is written down.
- In code: a value that varies by platform, device, environment, user configuration or input is a parameter read from its source of truth, with explicit handling or conversion for every value the contract allows; a fixed value carries its unit and the contract that fixes it; a value derived from another is computed in code, never retyped; a provider default is overridden explicitly.
- Bug class removed: code and tests built around one value of a variable fact. A sample rate hard-coded at 48 kHz, so 44.1 kHz input is never handled and every test passes; a unit mismatch; two constants that must agree and drift.
- Couple row: a literal in core logic whose fact varies across supported platforms, devices, configurations or inputs, with no read of the actual value and no handling of the alternatives; a test suite that exercises only the literal's value; a constant whose unit or clock is wrong for its consumer; two constants that must agree and are written separately.
- Model sections: time and constants, external contracts.
- Not a finding: a presentation or animation value; an unexplained magnitude of a genuinely fixed fact, which is an evidence gap to record, not a defect.

### hot-path: the shipping hot path's costs are known

- Invariant: per-frame and per-packet paths allocate, lock and call out only in known, bounded ways.
- In code: no allocation in the frame loop (pools, arenas, value types); logging argument construction behind the level gate; no lock held across an external call.
- Bug class removed: frame spikes from hidden allocation or argument formatting; a stall from a lock across an external call.
- Couple row: an allocation, lock or external call on a per-frame or per-packet path with no stated budget. Read from code; no measurement.
- Model sections: concurrent handoffs.
- Not a finding: cost on a path that is not hot; a cadence without a latency obligation.

### diagnostics: required outcomes are diagnosable at the required destination

- Invariant: each required outcome, and the facts that distinguish its remaining causes, reaches the required destination.
- In code: a diagnostic record built at the failure site carrying identity and observation time; a classification table that matches policy signatures before native-level fallback; suppression keyed and reset by one owner.
- Bug class removed: the silent failure; the merged cause; the log that reads replacement state.
- Couple row and traces: [logging.md](logging.md).
- Model sections: diagnostics.
- Not a finding: an internal state no policy requires logged.

## Readability lenses

Kept apart. Divergences under these lenses are maintenance costs, not correctness defects, and are labeled so.

### local-reasoning: one operation's correctness is decidable from one place

- Invariant: the facts needed to judge one operation live in one component or one file.
- Bug class reduced: a change that is right locally and wrong across files the author did not hold in mind; the same limit applies to an agent reviewer's context.
- Not a finding: an operation that is inherently cross-cutting and has one documented owner.

### one-rule: a rule has one representation

- Invariant: a rule or calculation is written once and consumed everywhere.
- Bug class reduced: two copies diverge.
- Not a finding: equal constants or similar code serving different rules; repeated enforcement at distinct trust boundaries.

### present-obligation: a mechanism answers a present consumer

- Invariant: every mechanism has a present caller or a written obligation.
- Bug class reduced: speculative machinery that must be maintained and tested.
- Not a finding: a non-use the goals document explains.
