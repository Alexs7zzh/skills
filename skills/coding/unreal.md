# Unreal cues

Read for Unreal Engine work, alongside cpp.md for C++. A mechanism points to what to investigate; provider details and version facts must be checked against the target before they settle a finding. Keep fork-specific build limits and policies in the project's documents.

## Unreal mechanisms

**Identity and provider semantics**
- For IDs, keys, and tokens, check the selected string comparison's case semantics in the target engine. Use an explicit comparison or stronger key type when identity requires it; an operator's spelling is not its contract.

**Lifetime and GC**
- Trace how a stored `UObject` reference participates in GC. A raw pointer alone neither retains its target nor guarantees nulling. In UE5, a `TObjectPtr` used as a reflected strong reference needs `UPROPERTY`; use `TWeakObjectPtr` when observing destruction without ownership. Check the target's [object-pointer contract](https://dev.epicgames.com/documentation/en-us/unreal-engine/object-pointers-in-unreal-engine). Resolving once and retaining a raw pointer across a frame or async gap defeats the weak reference.
- `FTimerManager`, `FTSTicker`, and `FHttpRequest` completion delegates can outlive their receivers; inspect the binding and teardown paths before accepting a captured `this`.
- Engine async results have a supported completion and reading context. For trace data (`QueryTraceData`), inspect the allowed frame phase and callback context before consuming it from a Slate active timer or another scheduler.
- Before adding manual failure completion around `FHttpRequest::ProcessRequest()`, inspect whether the target implementation already invokes the completion delegate on that path.
- Before reporting a missing Slate active-timer unregister, inspect whether widget destruction owns that cleanup in the target engine.
- `GetWorld()` can be null during teardown and in CDOs; code reachable from editor or shutdown paths must tolerate it. Cross-PIE-session caching of world objects needs a world-teardown hook.
- GC can run between an async request and its game-thread completion; captures across that gap follow the GC rules above.

**Blueprint, Slate, UMG**
- Blueprint pure nodes can be evaluated again by separate consuming executions; do not infer a call count from connected pins. Inspect the target graph's evaluation boundaries before judging cost or ordering. Keep state-changing operations on explicit execution flow.
- Widget pools (`UDynamicEntryBox` and friends) are the pooled-entry mechanism from good-code.md: create-before-remove, or reset on acquire.
- Activation gated on visibility or first draw can wedge: a component hidden before its first activation may never start the tick or timer that would ever show it.
- Painted is not visible: "the loading UI is up" claims need evidence past the first paint.

**Realtime and engine threading**
- The frame and audio-callback budgets are the contract. Check allocation and logging costs on the actual path; log-argument construction ahead of the verbosity check counts even when no line is emitted. An allocation-free policy belongs to the paths whose latency contract requires it.
- Game thread owns UObjects; render-state mutation goes through `ENQUEUE_RENDER_COMMAND`; SDK and task-graph callbacks name their delivery thread in their contract, not in your assumption.
- AudioMixer source resampling is pull-model: the source advances at the mixer's output rate regardless of the asset or device rate. The mixer rate is the timebase.
- For `USoundGenerator` block sizing, inspect the target's requested sample count, overrides and leftover-frame handling rather than assuming device callback size determines each pull.

**Replication**
- Durable state lives in replicated properties (convergent for late joiners); RPC sequences that build client state are fragile by construction. Walk a late joiner's experience explicitly.
- For fields that must represent one coherent snapshot, inspect the active replication system and serializer's behavior under loss and delayed updates. Neither C++ struct grouping nor `WithNetSerializer` alone establishes the target's delivery contract; verify the serialization path actually used.
- One authoritative side per mutation, validated server-side at the single write point; travel/connect URL options are as client-controlled as RPC parameters. OnRep handlers are idempotent reconciles of the new value, wrong under join-in-progress, dormancy, and batching otherwise.
