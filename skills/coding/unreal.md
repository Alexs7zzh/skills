# Unreal / C++ cues

Bug knowledge for Unreal C++: mechanisms first, then facts that are true of a specific engine version or of this fork. A mechanism outlives versions; a fact expires with them, so a fact carries its version and is verified against the fork before it closes anything.

## Mechanisms

**C++ memory model and semantics**
- Seqlock and sequence-validated copies with one-sided fences. A release store orders prior accesses only; an acquire load orders later accesses only. The writer needs a release fence between invalidate-store and data stores. The reader needs an acquire fence between data loads and recheck. The one-sided form passes every stress test on x86 TSO and tears on ARM64. Verify against the C++ memory model, never against passing stress tests.
- In-argument `MoveTemp`, or any read of a value another argument of the same call moves from. Argument evaluation order is unspecified: works on one compiler, ships empty on another.
- `FString` `==` folds case. Identity comparisons (IDs, keys, tokens) need `Equals(..., ESearchCase::CaseSensitive)` or a stronger key type.
- Casts that bypass the type system (`const_cast`, unchecked downcasts, `reinterpret_cast` on live objects) are runtime crashes waiting for their input; prove the fact or refine the model instead.

**UE lifetime and GC**
- A raw `UObject*` member without `UPROPERTY`/`TObjectPtr` is invisible to GC and dangles without ever becoming null. Non-owned references are `TWeakObjectPtr`; the resolved-once, stashed-raw defeat from good-code.md applies across a frame or async gap.
- `FTimerManager`, `FTSTicker`, and `FHttpRequest` completion delegates outlive careless objects; these are the highest-frequency dangling-this sources in a game client.
- Engine async results have a supported reading context: trace data (`QueryTraceData`) is unreadable from Slate active timers; verify the documented completion context of any async query.
- `GetWorld()` can be null during teardown and in CDOs; code reachable from editor or shutdown paths must tolerate it. Cross-PIE-session caching of world objects needs a world-teardown hook.
- GC can run between an async request and its game-thread completion; captures across that gap follow the GC rules above.

**Blueprint, Slate, UMG**
- Blueprint pure nodes re-evaluate per connected pin read, in an order nobody chose: side effects and consumed results belong on impure nodes.
- Widget pools (`UDynamicEntryBox` and friends) are the pooled-entry mechanism from good-code.md: create-before-remove, or reset on acquire.
- Activation gated on visibility or first draw can wedge: a component hidden before its first activation may never start the tick or timer that would ever show it.
- Painted is not visible: "the loading UI is up" claims need evidence past the first paint.

**Realtime and engine threading**
- The frame and audio-callback budgets are the contract; per-frame paths allocate nothing in steady state, and log-argument construction ahead of the verbosity check counts.
- Game thread owns UObjects; render-state mutation goes through `ENQUEUE_RENDER_COMMAND`; SDK and task-graph callbacks name their delivery thread in their contract, not in your assumption.
- AudioMixer source resampling is pull-model: the source advances at the mixer's output rate regardless of the asset or device rate. The mixer rate is the timebase.

**Replication**
- Durable state lives in replicated properties (convergent for late joiners); RPC sequences that build client state are fragile by construction. Walk a late joiner's experience explicitly.
- A replicated struct is not atomic without `WithNetSerializer`: fields can arrive across frames; fields that must arrive together share a NetSerializer or one property.
- One authoritative side per mutation, validated server-side at the single write point; travel/connect URL options are as client-controlled as RPC parameters. OnRep handlers are idempotent reconciles of the new value, wrong under join-in-progress, dormancy, and batching otherwise.

## Facts, version-bound

- UE 5.4: `FHttpRequest::ProcessRequest()` returning false STILL fires the completion delegate. Completing manually in the false branch double-completes the flow. Verify against the fork before citing on 5.8.
- UE 5.8: Slate active timers are widget-owned and `~SWidget` unregisters them, so widget destruction is a valid release path for a "missing" `UnRegisterActiveTimer`; suppress that finding.
- UE 5.8: a `USoundGenerator` that does not override `GetDesiredNumSamplesToRenderPerCallback` is pulled at the engine default of 1024 samples, not the device callback size; leftover frames carry over, so some callbacks publish more than one block.
- This fork: platform limits come from `UEBuild*.cs`, not OS or engine defaults; read the build config before any resource-exhaustion verdict.
