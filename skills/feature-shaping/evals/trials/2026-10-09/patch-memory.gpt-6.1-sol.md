## 1. Outcome

The player keeps their session running when a world is too heavy for their machine, with reduced scenery explained clearly. When the machine can comfortably show more, they see more of the world without having to guess a hardware setting.

**My recommendation: make memory safety automatic, but do not make “fill available memory” the governing goal.** Spare memory permits more content; it does not establish that rendering that content will feel good.

This assessment used the five exported issues, current client and engine source, and platform documentation. GitHub access failed. No files were changed, builds or editor sessions launched, or issue comments posted.

## 2. Idea chain

**R = developer ruling; D = proposed design choice.**

| Step | Problem it answered | Evidence for that problem | Control it introduced |
|---|---|---|---|
| All-content loading | Players should not lose scenery merely because it is distant. | The milestone preserves this goal; [distance residency](https://github.com/project-me-dev/tracker/issues/104) records the earlier decision to load everything. | **R:** every record’s content resident; distance could order work. Later explicitly reversed. |
| [Graphics-memory safety](https://github.com/project-me-dev/tracker/issues/83) | Loading a world could end the session. | Reported Mac allocation failures, especially on 8 GB machines; imported textures explained 85.5–97.3% of the added Metal allocation in three captures. | **R:** shared accounting before world-texture allocation, including concurrent work. **D/unsettled:** headroom and reduced-quality policy. Existing warning: 95%, sampled each second for five consecutive samples. |
| [Distance residency](https://github.com/project-me-dev/tracker/issues/104) | Keeping everything loaded sustained high memory and frame cost. | Around 22,000 actors; render-side distance/culling controls had not recovered performance. Actor residency reduced retained work substantially. | **R:** avatar/camera load and unload radii, nearest-first entering batches, paced teardown. A minimum residence timer was subsequently omitted. |
| [Player tiers](https://github.com/project-me-dev/tracker/issues/105) | Players needed access to the performance tradeoff. | The world analysis found that changing radius barely changed source bytes, but changed omitted visible objects. | **R:** four tiers, 150/250/400/500 m; unload at 1.25×; View Distance placement; no unlimited option. |
| [Nearby geometry](https://github.com/project-me-dev/tracker/issues/111) | A large platform could disappear while someone was standing on it. | Pivot distance can be large while the geometry is immediately beneath the player. | **R:** known bounds inform proximity; unknown bounds retain pivot fallback. Current project rulings subsequently enabled this without a flag. |
| [Memory expansion](https://github.com/project-me-dev/tracker/issues/205) | Small worlds and distant scenery remain incomplete despite spare memory. | The issue describes a ten-patch world and a hilltop view; these are motivating scenarios, not recorded measurements. | **R:** independent, unrestricted distance admission; completion-only patch-byte accounting; soft cap; K nearest candidates; memory-only eviction; no cap hysteresis. **D:** K=8, fixed cap, shared-file counting, keeping departing patches while under cap. |
| Your current idea | Fewer patches are preferable to an allocation failure and crash. | Your stated priority; the Windows fork has an explicit out-of-memory termination path. | **Tentative:** automatically detect capacity, use 80%, possibly remove the setting. These are proposals, not settled rulings. |

The surviving distinction is useful: **distance describes relevance; memory describes affordability.** Neither establishes the other.

## 3. Experience ladder

Worst first:

| Rung | What the player experiences | Scenario and reason for its priority |
|---|---|---|
| **L1 — Session ends** | Allocation failure crashes/exits the client. | A dense join exhausts graphics resources. Your current instruction explicitly places this above reduced content. |
| **L2 — World cannot be used** | Necessary ground, a destination, or an interaction target is unavailable; joining or continuing is refused. | The minimum usable scene cannot fit. **Assumed:** a functional blockage is worse than tolerable slow movement. |
| **L3 — Movement feels bad** | Sustained poor frame rate or repeated stalls. | Thousands of inexpensive resources fit in memory but are expensive to render. **Assumed:** this is worse than occasional loading waits. |
| **L4 — Waiting and churn** | Content arrives late, repeatedly disappears/reloads, or progress never settles. | Walking across a boundary repeatedly imports the same assets. **Assumed:** repeated disruption is worse than a stable, visibly reduced scene. |
| **L5 — Reduced scene** | Distant objects are missing or content has lower fidelity. | A hilltop vista is incomplete, but the nearby world remains usable. This is the degradation your current priority permits. |

The **L2–L5 ordering is my recommendation**, not a newly established product ruling.

## 4. Verdict on the proposal

**Issue 205 partly delivers.** It addresses unnecessary distant omissions, but it does not provide the safety outcome you now prioritize.

Its important failures are:

- **Dense nearby content:** distance admission never consults memory, and those patches cannot be evicted by the cap. The protected band can exhaust memory by itself.
- **Cold imports:** GPU allocation happens before actor publication. Completion-only accounting notices the cost after the dangerous operation.
- **Large concurrent imports:** K bounds patch count, not bytes. Eight model imports can contain many textures. Even a single oversized import can invalidate the intended margin.
- **Other consumers:** a patch-only cap excludes the renderer, avatars, browser resources, text render targets, and temporary allocation costs.
- **Delayed release:** subtracting a patch’s accounting does not establish that its GPU resources have been reclaimed.
- **Memory-rich, rendering-heavy worlds:** expansion can recreate the sustained performance problem that motivated distance residency.

The current source supports those distinctions: [texture creation occurs before completion](/Users/alex/dev/MEs/Plugins/MEs/CommonImporter/Source/CommonImporter/Private/Tasks/Texture/CreateTexture2D.h:147), while [actor dematerialization queues teardown](/Users/alex/dev/MEs/Source/MEs/_Patch/Managers/PatchMaterializer.cpp:801). The distance issue also explicitly reported deferred importer retention after eviction.

**“80% of detected VRAM” also partly delivers.** It is better than asking players to identify their hardware, but physical capacity is the wrong denominator. Windows exposes an application budget and current application usage; exceeding that budget can cause paging and stuttering. Apple exposes allocated resource bytes and an approximate recommended working set. Neither is a guaranteed allocation-success boundary. [Microsoft budgeting contract](https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/ns-dxgi1_4-dxgi_query_video_memory_info), [Apple working-set contract](https://developer.apple.com/documentation/metal/mtldevice/recommendedmaxworkingsetsize)

## 5. Proposal

Suggested replacement shape for **“Load the nearest out-of-range patches up to a graphics-memory cap.”**

### Change

Today, distance residency reduces retained content but cannot prevent a dense nearby area or concurrent imports from exhausting graphics memory.

Make world-content loading respond automatically to the platform’s graphics budget and current usage. Every new world-content GPU allocation must pass the same admission boundary, whether requested by proximity, interaction, or optional scenery loading. Prefer useful nearby content, release less useful content when necessary, and stop admitting content that cannot safely fit.

Once this boundary is validated, allow additional nearby-to-distant content when both memory headroom and acceptable frame performance permit it. A small, inexpensive world can become complete regardless of distance.

### Rulings — proposed for review

- **Safety applies to every admission.** Nearby distance and interaction holds establish priority; they do not create unlimited allocation rights.
- **Use the platform budget and whole-device/application accounting appropriate to that platform.** Include the existing renderer footprint through the sampled total; do not assign patches an independent percentage of physical capacity.
- **Account before allocation.** The client need not know a record’s size before fetching it. Decoded dimensions, format, frame count and mesh data become available before creating their GPU resources. Reserve a conservative incremental allowance at that boundary.
- **Account for concurrent work and delayed observation.** A fresh sample plus commitments not yet represented in that sample must cover the next allocation. Internal reservations here are application accounting, not a guarantee obtained from the OS.
- **Reclaim before spending again.** Actor teardown or the removal of a resident user is not proof of freed capacity. Shared assets and importer-held resources remain charged until their release is established.
- **Prefer stable degradation.** Pause optional loading under pressure and resume after meaningful recovery. Avoid repeatedly loading and evicting the same boundary patch.
- **Preserve a usable nearby scene first.** Prefer retaining ground beneath the player and ongoing actions. If the minimum usable scene cannot fit, decline the new action/travel or leave the world cleanly with an explanation, instead of silently removing necessary geometry.
- **No player-facing memory budget setting.** Detect machine facts. Keep the existing View Distance preference initially, because smoothness versus scene completeness can legitimately differ between users on the same machine.
- **80% is a candidate policy value, not an established safe default.** If evaluated, apply it to the reported budget for total usage, with concurrent commitments accounted for. Calibrate the margin separately on Windows and Mac.

### Done when

- A dense nearby area and a cold import burst can be curtailed **before** the dangerous allocations, rather than after publication.
- A budget reduction or additional renderer/browser/avatar use reduces optional world content while stationary.
- Shared files, canceled loads, world leave, delayed teardown and deferred importer work cannot falsely create headroom.
- Walking, free camera and teleport prioritize necessary content without repeatedly churning optional content.
- Limited loading produces understandable completion and a clear explanation of omitted content.
- Small-world completeness is demonstrated alongside settled frame performance; having spare memory alone does not pass.
- Windows and Mac policy evidence is collected separately, including integrated/unified-memory devices.

**Smallest useful delivery:** implement and validate the admission boundary while keeping the current residency selection. This protects the top rung without simultaneously changing how much distant scenery loads. Then add expansion if its benefit survives the frame-performance cases.

Pre-mortem risks:

| Risk | Consequence |
|---|---|
| **P1: An allocation path bypasses admission**, especially nested model textures, arrays/timing textures, text targets or later model resources. | L1. Coverage must be stated; texture-only coverage cannot be called complete graphics safety. |
| **P2: Cached usage, double-counted reservations or premature release credit misstates headroom.** | Undercount: L1. Overcount: L5 or L2. |
| **P3: Optional scenery fills memory while worsening rendering.** | L3. Memory permission needs a separate frame-performance condition. |
| **P4: Priority retains more essential/held content than can fit.** | L1 unless new work is refused; refusal yields L2. |
| **P5: Recovery keeps retrying a patch that cannot fit, or progress treats omitted work as pending forever.** | L4. Retry must require changed affordability, and limited completion must be explicit. |

## 6. Scenario table

These are predicted outcomes, not runtime results.

**Options:** **Current** = do nothing; **205** = original issue; **80%** = capacity-based loading alone; **Reshaped** = proposal above; **Slice** = safety boundary with current distance selection.

| Scenario | Current | 205 | 80% alone | Reshaped | Slice |
|---|---|---|---|---|---|
| **S1 Common:** nearby content fits, ordinary rendering cost | Works; L5 far omissions | More scenery | More scenery | Works; permitted expansion | Works; L5 far omissions |
| **S2 Dense nearby area** exceeds affordability | L1 possible | L1: distance exempt | L1 if checked late | L5 reduction; L2 if essentials cannot fit | Same safety outcome |
| **S3 Cold burst / one huge import**, although batch count is respected | L1 possible | L1 before publication | L1 without pre-allocation accounting | L5 or L2; allocations refused first | Same |
| **S4 Large GPU, cheap bytes, expensive rendering** | L3 possible, less resident work | L3 worsened by expansion | L3 | Expansion stops; L5 instead of added slowdown | Retains present exposure; no expansion |
| **S5 Other apps reduce Windows budget; browser/avatar/renderer grows** | L1/L3 possible | L1/L3: patch cap unchanged | L1/L3: physical capacity unchanged | Optional content yields; L5; sudden changes retain residual risk | Same |
| **S6 Eviction, shared files and importer retention delay reclamation** | L1 during renewed loads possible | L1: false free-byte credit | L1 if treated as immediately free | L4 wait for reclamation, then L5/works | Same |
| **S7 Tiny world spread across kilometres** fits and renders cheaply | L5 unnecessary omissions | Complete | Complete | Complete after safe expansion | L5 remains |
| **S8 Large platform has distant pivot / unknown bounds** | L2 possible with unknown bounds | L2 until admitted | L2 until admitted | Known bounds prioritized; cold unknown gap remains a risk | Same cold gap |
| **S9 Walk/teleport around a full boundary** | L4 reloads | L4 possible without cap hysteresis | L4 without recovery policy | Stable L5; necessary loads may still wait | Existing spatial hysteresis plus pressure pause |
| **S10 Sampler missing, stale or falsely low** | L1 exposure | Patch accounting still misses total | False confidence; L1 | Pause new unaffordable/unknown allocations: L5/L2; bad undetected data remains P2 | Same |
| **S11 Required collision or held action alone cannot fit** | L1 possible | L1: exemptions | L1 or silently broken L2 | Explicit L2 refusal/exit; preserve existing usable state where possible | Same |
| **S12 Optional content is permanently unaffordable** | L5, range-based | L4 if accounting/settlement stalls | L4 if retried forever | Limited completion: L5 | Limited completion: L5 |

For example, an **8 GiB GPU with a current 5 GiB application budget** would have a 6.4 GiB target under “80% of physical VRAM”—already above its application budget. This is an illustrative divergence case, not a measurement of an MEs device.

| Option | Contention: who yields? | Settings cost | Failure contract |
|---|---|---|---|
| Current | Distance leaves yield; nearby and held content do not respond to budget pressure. | View Distance and existing quality choices. | Warning may arrive; allocation failure can still end the session. |
| 205 | Memory-admitted patches yield to unrestricted distance loads; other consumers are outside its cap. | View Distance; cap and K are developer console values. | Soft overshoot accepted; no safety promise for nearby content or total use. |
| 80% alone | Undefined without total accounting and a victim policy. | No memory setting needed; removing View Distance removes a separate performance preference. | No bounded result unless allocation timing, release and signal failure are also specified. |
| Reshaped | Optional scenery yields first, then lower-priority content; necessary new work can be refused. | Existing quality preferences; no memory-cap slider. | Keep existing usable content and controls; pause loading on unusable measurement. Explain L5/L2. Genuine GPU failure remains potentially fatal. |
| Slice | Same memory priority, without optional expansion. | Keep current preferences. | Same safety contract; distant omissions remain. |

Two users on the **same machine** can reasonably want different View Distance values: one navigating a busy world values smooth movement; another standing still to inspect a panorama values completeness. That earns a preference. Neither needs to choose the machine’s memory capacity.

## 7. Measurement

| Control or quantity | Protects | Classification, divergence and source |
|---|---|---|
| All-content residency / unlimited mode | L5 | **Proxy for completeness.** Content can all be resident while L1/L3 fails. Historical milestone and distance issue. |
| Load/unload radii; four tiers; 1.25× unload ratio | L1/L3/L4/L5 | **Proxies for retained cost and relevance.** Dense nearby content can fail; sparse distant content can be affordable. Current [tier mapping](/Users/alex/dev/MEs/Source/MEs/Settings/LyraSettingsLocal.cpp:826). |
| Spatial hysteresis; omitted residence timer | L4 | **Proxies for churn.** A teleport or changing budget can still produce repeated imports. Timer omission is documented in the distance issue’s completion comment. |
| Geometry bounds, avatar/camera viewpoints, travel prediction | L2/L5 | Bounds proximity is **direct geometric measurement**, but a **proxy for usefulness and visibility**. Giant/offset bounds can include irrelevant content; unknown bounds miss nearby geometry. [Proximity calculation](/Users/alex/dev/MEs/Source/MEs/_Patch/Managers/PatchResidencyFilter.cpp:268). |
| Nearest-first admission / farthest-first eviction | L2/L5 | **Proxy for usefulness.** A distant platform can matter more than nearby decoration. Current materializer and issue 205. Keep this inexpensive ordering initially; it is not a safety bound. |
| Source bytes and resident patch counts | L1/L3 | **Proxies for GPU bytes/work.** Compression ratios, texture expansion, sharing and component cost diverge. Tier issue explicitly identifies source-byte evidence as a proxy. |
| Patch-only cap; completed `GetResourceSizeBytes`; shared-file user counts | L1/L5 | **Proxies for reclaimable total graphics allocation.** Exclude other consumers and pending work. Texture sizing reports resident mip estimates; static-mesh sizing includes unknown-memory categories. [Texture accounting](/Users/alex/dev/5.8/Engine/Source/Runtime/Engine/Private/Texture2D.cpp:1193), [mesh accounting](/Users/alex/dev/5.8/Engine/Source/Runtime/Engine/Private/StaticMesh.cpp:1024). Useful attribution, not the admission authority. |
| K≈5–10; proposed K=8 | L3/L4 and intended L1 protection | **Direct count**, **proxy for work/bytes**. Unequal import costs defeat it. Issue 205; existing per-image limits do not bound aggregate world allocation. |
| Pre-scan cap check; memory tags; dirty flags; saved distances; no stationary scans | L3/L4 | Scheduling controls are **proxies for low overhead and timely correction**. External pressure can change while stationary, and allocations can race the scan. Measure actual frame/selection cost separately. Issue 205 and current materializer. |
| Warning at 95%; 1-second sampling; five consecutive samples | L1 | **Proxy for sustained danger.** A burst can fail before the warning. [Current warning policy](/Users/alex/dev/MEs/Source/MEs/Performance/PerformanceClientStatRuntime.cpp:85). |
| Detected capacity ×80%; proposed headroom and recovery gap | L1/L4 | **Proxy for safe future allocation.** Budget changes, baseline cost, burst size and fragmentation diverge. The percentage and recovery margin require calibration. |
| Windows budget and application usage | L1/L3 | **Direct reported quantities**, but **proxies for next-allocation success**. Already sampled by MEs. The fork returns a cached snapshot and can collect at one-second intervals in configurations without stats. [Client sampler](/Users/alex/dev/MEs/Source/MEs/Performance/PerformanceClientStatRuntime.cpp:320), [engine snapshot](/Users/alex/dev/5.8/Engine/Source/Runtime/D3D12RHI/Private/D3D12RHI.cpp:384), [DXGI contract](https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_4/nf-dxgi1_4-idxgiadapter3-queryvideomemoryinfo). |
| Metal allocated bytes / recommended working set; system-memory pressure | L1/L3 | Allocation and pressure are **direct reported signals**; the recommendation is **a proxy for safe operating conditions**, particularly with unified memory. Already sampled in the client. [Apple allocation API](https://developer.apple.com/documentation/metal/mtldevice/currentallocatedsize), [working-set API](https://developer.apple.com/documentation/metal/mtldevice/recommendedmaxworkingsetsize). |
| Incremental GPU commitment before allocation; confirmed reclamation | L1 | **Directly enforceable application accounting**, using conservative allocation-cost estimates. Cannot prevent untracked consumers or OS changes. Image upload dimensions and layout already exist [before GPU creation](/Users/alex/dev/MEs/Plugins/MEs/CommonImporter/Source/CommonImporter/Private/Tasks/Texture/CreateTexture2D.h:91); all relevant paths still need coverage validation. |
| Frame time / hitching condition for expansion | L3 | Frame durations are **direct measurements**; attribution and prediction remain imperfect. Existing [performance runtime](/Users/alex/dev/MEs/Source/MEs/Performance/PerformanceClientStatRuntime.cpp:633) already collects frame, game-thread, render-thread and GPU timing. Thresholds are not established here. |
| Guaranteed absence of future allocation failure | L1 | **Unmeasurable in advance.** Budget compliance reduces risk; it cannot guarantee that an individual allocation or device operation succeeds. D3D12 can return insufficient-memory failure, and this fork terminates on its out-of-memory path. [API failure contract](https://learn.microsoft.com/en-us/windows/win32/api/d3d12/nf-d3d12-id3d12device-createcommittedresource), [fork handling](/Users/alex/dev/5.8/Engine/Source/Runtime/D3D12RHI/Private/D3D12Util.cpp:782). |

## 8. Decisions for the user

1. **Replace the soft-cap rulings?**  
   Original: unrestricted nearby admission, completion-only measurement, no reservations, accepted overshoot. Recommended: every new allocation shares a pre-allocation safety boundary. Keeping the original is defensible as scenery enhancement, but it cannot serve your new crash-avoidance priority.

2. **Ship safety first, or safety and expansion together?**  
   **Recommend safety first.** It leaves distant omissions temporarily, but separates proving crash-risk reduction from proving that more resident content improves the experience.

3. **Keep View Distance?**  
   **Recommend keeping it initially, with safety always automatic.** Removing it requires accepting automatic responsibility for the smoothness-versus-completeness tradeoff. This revisits the explicit tier ruling and the historical “no unlimited player option” ruling; neither should disappear implicitly.

4. **Accept the proposed ladder and insufficient-capacity behavior?**  
   I recommend L1 → L2 → L3 → L4 → L5: stable reduced scenery before sustained slowdown; explicit refusal before silently losing necessary geometry. Alternatives include more complete but slower scenes, or allowing partial nearby worlds despite impaired navigation.

5. **Unavailable measurement: stop new uploads or continue heuristically?**  
   **Recommend pausing new uploads and explaining the limitation.** Continuing with a fixed fallback preserves more access but reintroduces an unbounded safety risk. Existing content and the ability to leave should remain available where the client can sustain them.

**Unverified facts:** current native parents, sub-issues, blockers and any newer issue comments could not be checked. Older linked issues were available only through the supplied issues’ summaries. Referenced capture artifacts were absent locally, so their results are reported historical evidence. The appropriate safety margin, sampler freshness requirement, actual reclamation latency, frame-performance threshold and complete allocation-path coverage remain unmeasured; **80% has no established safety evidence here**.