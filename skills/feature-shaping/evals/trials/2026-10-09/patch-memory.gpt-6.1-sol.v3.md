**1. Outcome**

Players can enter and explore worlds without patch loading exhausting graphics memory and ending their session. When resources are scarce, they see less content while keeping a usable world.

**2. Verdict on the proposal**

**Partly delivers.** [Load the nearest out-of-range patches up to a graphics-memory cap](https://github.com/project-me-dev/tracker/issues/205) improves distant visibility. It does not establish crash protection: **dense nearby content**, **one enormous import**, **competing memory use**, and **delayed reclamation** defeat its cap.

Your new direction gets the priority right: fewer patches beats losing the session. But **80% of installed VRAM is another proxy**, and spare memory does not establish spare rendering capacity.

The client already reads Windows graphics usage and its process budget, plus Metal allocation and its recommended working set. Windows budgets can change; exceeding one can cause paging and stuttering. Metal’s threshold is an approximation for maintaining performance. Neither guarantees allocation success. [Microsoft budget documentation](https://learn.microsoft.com/windows/win32/api/dxgi1_4/ns-dxgi1_4-dxgi_query_video_memory_info), [Apple working-set documentation](https://developer.apple.com/documentation/metal/mtldevice/recommendedmaxworkingsetsize).

Windows allocation failure does terminate the client through the current engine’s OOM path. That supports prevention before allocation; it does not establish memory pressure as the cause of every device-loss report.

I used the supplied issue exports because GitHub access failed. Live relationships, blockers, and other linked issue contents remain **unverified**.

**3. Proposal**

Suggested replacement title: **Keep patch loading within live graphics-memory headroom**

**Change**

Give all new patch GPU allocations a shared admission boundary. Nearby content gets priority, but proximity cannot bypass memory safety.

Use current platform usage and budget, account for accepted allocations not yet reflected in that measurement, and leave headroom for renderer growth, uploads, sampling delay, and other consumers. **80% is a placeholder**, to be replaced or justified by measured peaks and allocation overhead.

A patch’s final size need not be known before importing it. Texture dimensions, format, and animation frame count are already known before GPU creation. Reserve there, before the dangerous allocation. Completion accounting remains useful for reconciliation and eviction.

When pressure rises, stop admissions and release dispensable content. Preserve loaded footing and active interactions where possible. Logical actor removal must not immediately count as reclaimed memory.

If essential content cannot fit, retain records and offer a controlled refusal or exit from the world. A denied admission must settle as limited content, rather than leave loading progress waiting forever. Missing or stale budget input stops speculative filling; it does not mean unlimited capacity. Allocation failure can still terminate the process, so this is best-effort prevention.

**First delivery—the smaller slice:** apply that safety boundary to existing residency requests. Keep current distance behavior initially.

**Later filling:** admit nearest additional patches when memory permits. Also stop or reduce optional filling when measured frame cost exceeds an agreed allowance. The allowance and stability window are **placeholders** requiring representative measurements. Memory availability alone must not trigger full-world loading.

No new player-facing memory setting. Keep nearest-first scheduling, paced work, both viewpoints, bounds fallback, and inexpensive residency scans. Budget changes must wake admission decisions even while the player stands still.

**Done when**

The dense, oversized, concurrent-import, stationary-pressure, delayed-release, and essential-content scenarios below produce the specified behavior. Validate Windows separately from Mac. Additional filling also needs matched frame-cost evidence.

**Pre-mortem risks:** underestimated allocation overhead → R1; sudden external pressure → R1; premature release credit → R1; protected content exceeding capacity → R2; optional filling or repeated retries causing stalls → R3.

**4. Decisions for the user**

- **Overturned premise—soft visibility cap versus safety.** Recommend replacing completion-only measurement, no reservations, unconditional nearby admission, and memory-only eviction from the issue’s rulings. Keeping them preserves the smaller implementation, but cannot support crash prevention.
- **Essential content under extreme pressure.** Recommend controlled refusal/exit before removing the player’s footing or active target. The alternative keeps the world open with those interruptions.
- **View Distance.** Recommend retaining it initially. On the same machine, an explorer may prefer distant scenery while a builder prefers responsiveness. That preference can earn a setting; hardware capacity does not. Removing it needs evidence or an automatic frame-cost policy.
- **Overturned console-only full loading.** Later automatic filling would make fitting worlds fully resident by default. Choose that behavior after safety and render-cost validation, or retain the existing range ceiling.
- **Assumed ordering:** interrupted footing/actions are worse than sluggishness, which is worse than missing scenery. Swapping the last two favors completeness over responsiveness.
- **Adjacent:** device loss from non-memory causes remains outside this design. Keep it separate, or explicitly widen the investigation.

**5. Idea chain**

| Step | Problem it answered | Evidence for that problem | Control it introduced |
|---|---|---|---|
| All content resident | Complete world presentation | 22,107 actors; costly world loading | None |
| [Device graphics-budget safety](https://github.com/project-me-dev/tracker/issues/83) | Loading ends sessions | 37 Mac crash processes; textures explain 85.5–97.3% of added Metal allocation | **Ruling:** pre-allocation accounting; permitted degradation; Windows validation |
| [Distance residency](https://github.com/project-me-dev/tracker/issues/104) | Excess resident content and render cost | RHI accounting 30.933 → 15.482 GiB; frame interval 39.211 → 38.030 ms; physical VRAM not established | **Ruling:** radii; hysteresis; two viewpoints; holds; nearest-first paced work |
| [Player loading tiers](https://github.com/project-me-dev/tracker/issues/105) | Players cannot adjust the tradeoff | Fixture visibility analysis; player demand otherwise *claimed* | **Ruling:** four tiers, 150–500 m; 1.25× unload; no unlimited tier |
| [Nearby geometry residency](https://github.com/project-me-dev/tracker/issues/111) | Large platforms disappear under players | Accepted platform scenario; runtime memory comparison waived | **Ruling:** conservative bounds; unknown-bound pivot fallback |
| Travel prediction | Content arrives after movement | User direction; needed lead duration unmeasured | **Ruling:** movement lookahead; **placeholder:** 2 s, 250 m maximum |
| Interaction residency | An acted-on patch disappears | Accepted user scenarios; incidence unmeasured | **Ruling:** action-owned holds, including unloaded targets |
| [Memory filling](https://github.com/project-me-dev/tracker/issues/205) | Spare capacity leaves distant gaps | Ten-patch/hill scenarios *claimed*; available capacity unmeasured | **Rulings:** soft patch cap; completion-only bytes; independent admissions; nearest-K; dirty flags |
| Current suggestion | Avoid memory exhaustion automatically | User priority; Mac crashes; Windows fatal OOM code | **Proposal:** detect capacity; 80%; possibly remove settings |

**6. Experience ladder**

| Rung | What the player experiences | Scenario | Why above the next rung |
|---|---|---|---|
| **R1** | Session terminates | Import reaches fatal GPU OOM | Entire session lost; fewer patches preferred |
| **R2** | Footing/action interrupted, or world unavailable | Essential content cannot remain resident | **Assumed:** basic use outweighs responsiveness |
| **R3** | Sluggish movement, stalls, repeated loading | Resident content fits memory but costs too much work | **Assumed:** responsiveness outweighs scenery completeness |
| **R4** | Visible world content missing | Small or distant content excluded unnecessarily | Session remains usable |
| **R0** | Usable, sufficiently complete world | Workload fits available resources | Successful outcome |

**7. Scenario table**

*Expected outcomes, not executed results. “Reshaped” includes later optional filling; “Safety slice” retains current range eligibility.*

| Scenario | Do nothing | Original soft cap | 80% capacity alone | Reshaped | Safety slice |
|---|---|---|---|---|---|
| Common nearby scene | R0 | R0 | R0 | R0 | R0 |
| Small, cheap, widely spread world | R4 | R0 | R0 | R0 | R4 |
| Dense content inside even Small radius | R1 possible | R1 possible; nearby exempt | R1 possible; timing unspecified | R4; R2 if essential cannot fit | R4; R2 if essential cannot fit |
| One enormous animation among K loads | R1 possible | R1 possible | R1 possible | R4; denied before GPU creation | R4; denied before GPU creation |
| Concurrent imports spend the same apparent headroom | R1 possible | R1 possible | R1 possible | R4; shared reservations | R4; shared reservations |
| Other applications consume memory while player is stationary | R1/R3 | R1/R3; dirty state misses change | R1/R3; fixed capacity | R4; budget change wakes decisions | R4; budget change wakes decisions |
| Actor leaves; GC/GPU/importer still retains resources | R1 possible | R1; early byte subtraction | R1 if release credited early | R4 until reclamation established | R4 until reclamation established |
| Many patches share a cheap resource | R0/R4 | R4; permitted overcount stops early | R4 if accounting overcounts | R0 where render cost permits | R4 beyond range |
| Plenty of memory; expensive rendering | R3 possible | R3 possible; fills anyway | R3 possible | Optional filling backs off; baseline R3 may remain | Existing performance behavior |
| Platform or active target under pressure | R1 possible | R1 possible; exemptions survive | R2 if indiscriminately evicted | Preserve first; controlled R2 if impossible | Same |
| Cold join; distant platform has unknown bounds | R4/R2 | No timely discovery guarantee | No timely discovery guarantee | R4/R2; preserve known fallback | R4/R2 |
| Budget absent, stale, or misleading | R1 possible | Patch cap misses total pressure | R1 possible | Stop new speculative allocations; R4/R2 | Same |
| Cap boundary crossed repeatedly | R3 possible | R3; no cap hysteresis | R3 possible | Retry after meaningful capacity change | Same |
| Sudden unaccounted renderer allocation | R1 possible | R1 possible | R1 possible | Residual R1 risk; measured reserve | Same residual risk |

| Option | Contention: what else uses memory; who yields | Settings cost | Failure contract |
|---|---|---|---|
| Do nothing | Renderer, avatars, browsers, imports; distance decides | Existing View Distance | No memory admission protection |
| Original soft cap | All compete; only extra distant residents yield | Existing tier; developer cap/K CVars | Nearby loads and oversized batches can still terminate |
| 80% capacity alone | OS/apps and engine compete; yield policy unspecified | No necessary memory setting | Fixed percentage cannot establish safety |
| Reshaped | Optional content yields first; essential content prioritized, never unlimited | No memory setting; existing performance preference | Limited content; controlled refusal if essential footprint cannot fit; residual fatal risk |
| Safety slice | Same shared gate; no extra distant filling | Existing View Distance | Range gaps remain; same essential-content fallback |

**8. Measurement**

| Control | Protects | **Stands for** | **Measured** | Source |
|---|---|---|---|---|
| Load radius; four distance tiers | R1/R3/R4 | Affordable, useful resident content | **Estimated:** density, animation size, sharing and geometry diverge; total memory/frame cost directly observable | [Tier evidence](https://github.com/project-me-dev/tracker/issues/105) |
| Unload radius; 1.25× spatial hysteresis | R3 | Avoiding repeated unload/reload | **Direct:** eviction events; **estimated:** remaining churn across teleports or large movements | [Materializer counters](/Users/alex/dev/MEs/Source/MEs/_Patch/Managers/PatchMaterializer.cpp:1310) |
| Minimum resident time, subsequently omitted | R3 | Avoiding churn | **Estimated:** time cannot establish stability; no remaining failure justified retention | [Distance implementation ruling](https://github.com/project-me-dev/tracker/issues/104#issuecomment-5825005393) |
| Avatar/camera inputs; join fallback | R2/R4 | Where content is needed | **Estimated:** locations direct; relevance not guaranteed by proximity | [Residency rulings](/Users/alex/dev/MEs/Docs/feature-references/PatchReplication.md:76) |
| Nearest-first admission/farthest-first eviction | R2/R4 | Content’s immediate usefulness | **Estimated:** hidden nearby object versus useful distant platform | [Memory-filling proposal](https://github.com/project-me-dev/tracker/issues/205) |
| Conservative geometry bounds; pivot fallback | R2/R4 | Actual nearby surface | **Estimated:** offset/long meshes over-admit; unknown bounds miss surfaces | [Bounds residency](https://github.com/project-me-dev/tracker/issues/111) |
| Prediction: 2 s, maximum 250 m | R2/R4 | Content ready before arrival | **Estimated:** speed direct; turns, cold downloads and import latency diverge | [Prediction controls](/Users/alex/dev/MEs/Source/MEs/_Patch/Managers/PatchLoadSubsystem.cpp:63) |
| Browser/placement/action holds | R2 | Itself: explicit residency demand | **Direct:** acquisition lifetime; demand does not establish available memory | [Hold acquisition](/Users/alex/dev/MEs/Source/MEs/_Patch/Managers/PatchLoadSubsystem.cpp:495) |
| Shared materializer frame allowance | R3 | Itself: permitted scheduling time | **Direct:** elapsed work and overruns; a single operation may exceed allowance | [Frame allowance](/Users/alex/dev/MEs/Source/MEs/_Patch/Managers/PatchLoadSubsystem.cpp:1070) |
| Warning at 95%, five one-second samples | R1 | Impending allocation failure | **Estimated:** advisory budget; large imports can fail before warning | [Pressure monitor](/Users/alex/dev/MEs/Source/MEs/Performance/PerformanceClientStatRuntime.cpp:1095) |
| Proposed static animation/downscaling | R1/R4 | Useful presentation at lower cost | **Direct:** resulting dimensions/frames; acceptable visual usefulness needs review | [Graphics-budget policy](https://github.com/project-me-dev/tracker/issues/83) |
| Soft cap on published patch bytes; sound excluded/text optional | R1/R4 | Total graphics headroom | **Estimated:** omits baseline, pending work and other consumers; skipped text can allocate | [Soft-cap design](https://github.com/project-me-dev/tracker/issues/205) |
| Completion-only `GetResourceSizeBytes` | R1 | Live physical GPU allocation | **Estimated:** texture payload tracks resident mips; mesh totals include system/unknown memory; heap overhead differs | [Texture accounting](/Users/alex/dev/5.8/Engine/Source/Runtime/Engine/Private/Texture2D.cpp:1193), [Mesh accounting](/Users/alex/dev/5.8/Engine/Source/Runtime/Engine/Private/StaticMesh.cpp:4942) |
| Per-file counting; permitted shared overcount | R4 | Distinct live resources | **Estimated:** repeated instances may add no texture bytes; file identity is not allocation identity | [Weak resource cache](/Users/alex/dev/MEs/Source/MEs/_Patch/Managers/PatchContentLoader.h:88) |
| K ≈ 5–10; suggested 8 | R1/R3 | Bounded exposure and selection work | **Estimated:** count bounds neither bytes nor allocation cost; benchmark needed | [K proposal](https://github.com/project-me-dev/tracker/issues/205) |
| Dirty flags; pre-scan cap mode; no cap hysteresis | R3 | Cheap decisions and stable residency | **Direct:** scan work; **estimated:** local dirty events miss external pressure and boundary churn | [Scan design](https://github.com/project-me-dev/tracker/issues/205) |
| Subtract bytes on dematerialization | R1 | Reusable memory | **Estimated:** teardown, GC, deferred Lumen and GPU release outlive the logical leave | [Dematerialization](/Users/alex/dev/MEs/Source/MEs/_Patch/Managers/PatchMaterializer.cpp:801), [Deferred Lumen ownership](/Users/alex/dev/MEs/Plugins/MEs/CommonImporter/Source/CommonImporter/Private/Tasks/LoadModelTask.h:368) |
| Automatic 80% of installed capacity | R1 | Safe remaining headroom | **Estimated:** process budget, baseline and unified-memory pressure diverge; 80% unsupported | [Existing platform sampling](/Users/alex/dev/MEs/Source/MEs/Performance/PerformanceClientStatRuntime.cpp:320) |
| Proposed live-budget gate and safety reserve | R1 | Safe next allocation | Budget/usage **direct**; safety **estimated** because signals are advisory and delayed; calibrate reserve | [Windows budget](https://learn.microsoft.com/windows/win32/api/dxgi1_4/ns-dxgi1_4-dxgi_query_video_memory_info), [Metal working set](https://developer.apple.com/documentation/metal/mtldevice/recommendedmaxworkingsetsize) |
| Proposed shared pending-allocation reservations | R1 | Unreflected allocation exposure | Payload dimensions **direct** before GPU creation; physical overhead **estimated**; avoid double counting samples | [2D upload sizing](/Users/alex/dev/MEs/Plugins/MEs/CommonImporter/Source/CommonImporter/Private/Tasks/Texture/CreateTexture2D.h:33), [Animation sizing](/Users/alex/dev/MEs/Plugins/MEs/CommonImporter/Source/CommonImporter/Private/Tasks/Texture/CreateTextureArray.h:64) |
| Proposed budget freshness/wakeup rule | R1 | Current capacity knowledge | Snapshot age must be established; current D3D12 getter returns cached data, potentially refreshed at one-second intervals | [Cached getter](/Users/alex/dev/5.8/Engine/Source/Runtime/D3D12RHI/Private/D3D12RHI.cpp:384), [Collection cadence](/Users/alex/dev/5.8/Engine/Source/Runtime/D3D12RHI/Private/D3D12CommandContext.cpp:743) |
| Proposed footing/interaction priority | R2 | Continuing the current action safely | Holds and current floor **direct**; whole essential-footprint feasibility **unverified** | [Current floor](/Users/alex/dev/5.8/Engine/Source/Runtime/Engine/Classes/GameFramework/CharacterMovementComponent.h:887), [Interaction ruling](/Users/alex/dev/MEs/Docs/feature-references/PatchReplication.md:80) |
| Proposed optional-fill frame-cost allowance | R3/R4 | Responsive presentation | Frame intervals/thread times **direct**; future marginal cost **estimated**; threshold/window placeholders | [Existing frame samples](/Users/alex/dev/MEs/Source/MEs/Performance/PerformanceClientStatRuntime.cpp:633) |