# Feature shaping: issue 205 (load out-of-range patches up to a graphics-memory cap)

Read-only. Sources: issues 205, 104, 105, 111, 83, plus 82 and 83's sub-issues 101-103 (via `gh`); `Docs/feature-references/PatchReplication.md`; residency, settings and performance code in the MEs client; the D3D12/Metal out-of-memory paths in the engine fork; Microsoft's DXGI docs.

## 1. Outcome

The game never closes, freezes or crawls because a world's content grew larger than the machine can hold at that moment. Within what the machine can hold, the player sees as much of the world as possible, nearest first, and the thing they stand on or are working with is the last to go.

## 2. Idea chain

| Step | Problem it answered | Evidence for that problem | Control it introduced |
| --- | --- | --- | --- |
| 0. Load every record's content (2026-09-16, reversed 09-24) | A large model's surface can be under a player whose pivot is far away, so no server distance rule can decide what a client needs | Ruling 2026-09-14 in PatchReplication.md ("Every client holds every record") | Resident set = all records (**ruling**, later reversed) |
| 1. Issue 83: stay within the device graphics budget (09-18 to 09-25) | Macs crash during world load when Metal allocation passes the recommended working set | 37 crash processes and 9 users in 7 days, mostly 8 GB M1/M2. Textures explain 85-97% of the allocation that world loading adds. Pre-world baseline is 1.58 GiB | 95% warning after 5 one-second samples (**design choice**, kept as a late backstop). Pre-allocation reservation and degradation (101-103), approved in principle (**ruling** 09-22: an animated image may become a static frame, and images may be downscaled). 101-103 were all closed *not planned* on 09-25, when 83 closed after 104 landed |
| 2. Issue 104: distance residency (09-24) | Frame time and graphics memory stay high with all 22k patches resident. Render-side levers did not help | Same-process comparison: 22,107 to 2,076 actors, and RHI accounting fell from 30.9 to 15.5 GiB. Mean frame time only went from 39.2 to 38.0 ms, with Lumen as a confound | Load 25,000 uu / unload 31,000 uu (**ruling**). Pivot tolerance 500 uu (**design**). Teardown paced inside the frame budget (**ruling**). Minimum resident time (**ruling**, omitted by the implementer). "Loading everything is reachable only through console variables" (**ruling**) |
| 3. Issue 105: player tiers (09-24/25) | Players cannot reach the radius, and machines differ | World 5645: across the tiers, resident source bytes stay at 0-13%. "Memory hardly moves across the ladder" | View Distance Near/Medium/Far/Epic sets 150/250/400/500 m, unload at 1.25x (**ruling**, placement **ruling**). Presets and Auto-Set Quality drive it, and Auto-Set Quality is a CPU/GPU speed benchmark, not a memory reading |
| 4. Issues 111, prediction, holds (10-02 to 10-08) | A platform unloads under the player, content pops in during travel, an interaction target disappears | Phase-one accepted costs, user rulings | Bounds-derived proximity (**ruling**). PredictionSeconds 2 s, MaxPredictionDistance 25,000 uu (**design** under a **ruling**). Residency holds (**ruling**) |
| 5. Issue 205 (10-08) | A small world shows only nearby patches. A player on a hill sees an empty horizon while gigabytes of memory sit unused | Argument only: no count of affected players, no measurement | Patch-content byte cap as a cvar, default to be measured on an 8 GB Mac (**ruling**: soft cap). K of about 8 nearest per scan (**ruling** 5-10). Memory tag and dirty flags (**design**). Flip at the boundary with no hysteresis (**ruling**). Only memory-admitted patches are evicted (**ruling**). Distance admission unchanged and never consults memory (**ruling**) |
| 6. Your current idea (10-09) | The only thing that matters is not running out of graphics memory, especially on Windows, where allocation failure is fatal. Distance indicates nothing because worlds differ in density | Your statement. The engine confirms the fatal path: E_OUTOFMEMORY reaches `D3D12Util.TerminateOnOutOfMemory` (`Engine/Source/Runtime/D3D12RHI/Private/D3D12Util.cpp:842-850`), and Metal command-buffer OOM reaches `MetalCommandBufferFailureOutOfMemory` (`MetalCommandList.cpp:135-166`) | 80% of auto-detected VRAM, no user setting (**idea**, not ruled) |

## 3. Experience ladder (worst first)

1. **The session ends (crash or device loss).** An 8 GB M1 resumes into a dense world at startup, a Metal command buffer fails with out-of-memory, and the next launch resumes the same world again (issue 84). On Windows, E_OUTOFMEMORY terminates the process, or the device is lost (MES-WT reached 3,319 of a 3,370 MB budget 24 s before loss). *Above 2:* the session and any work in progress are gone, and the failure can repeat on every launch.
2. **The whole machine stutters or stalls.** A Windows 6 GB GPU runs alongside Discord and a browser, and usage passes the DXGI budget. Microsoft documents that the OS then pages video memory and the app "may incur stuttering". An 8 GB Mac swaps. *Above 3:* it degrades everything at once, other apps included, and it sits directly in front of rung 1.
3. **What the player stands on or is working on disappears.** Memory relief removes the platform under the avatar and they fall, or a selected patch vanishes mid-edit. *Above 4:* it changes what the player can do and loses action progress, not just what they see.
4. **Nearby content is missing or slow to appear.** After a teleport the area stays empty for seconds, or gaps appear around the player. *Above 5 (assumed):* missing content is wrong; low frame rate is only uncomfortable.
5. **Frame rate stays low.** In a world of many small, cheap patches on a large GPU, everything fits in memory, but the count of patches costs render and game-thread time. *Assumed* ordering. The evidence is weak: in 104, ten times fewer actors moved frame time by only 3%.
6. **Distant content is missing.** A player on a hill in the 22k world on a 24 GB GPU sees nothing past 250 m, and a 10-patch world is only half shown. This is 205's motivation. *Below 5 (assumed):* the near view is intact.
7. **The player pays more: longer initial progress bar, more download, heat and battery.** A laptop on hotel Wi-Fi visits a world that fits in memory and downloads all of it. *Assumed* bottom.

## 4. Verdict on the proposal

**Issue 205 partly delivers.** It fixes S3 (small world) and part of S4 (horizon). It misses S2, S5, S6, S7, S8, S11 and S12. On S5, S6 and S7 it is worse than doing nothing, because it adds load up to a cap that does not see what else holds memory.

The reason is that it treats the top rung as protected by a patch-bytes cap. That cap:
- counts only patches, not the engine baseline, render targets, avatars, browsers or other apps;
- is a single fixed number for every machine, tuned on an 8 GB Mac: too high for a 4 GB Windows GPU, far too low for a 24 GB one;
- leaves the distance band, the part that loads thousands of patches in a burst, completely unguarded.

**Your current idea mostly delivers.** Graphics memory is the only control that maps onto rung 1. Memory capacity is a fact about the machine, so it should not be a user setting. Three corrections:

- **The base is wrong.** "80% of detected VRAM" ignores other apps (S5) and integrated GPUs (S11). On a Mac, "VRAM" is unified RAM: 80% of 8 GB is above the 5.3 GiB recommended working set (S2). The platforms already report the right number, the live budget for this process, and the client already samples it.
- **One line thrashes (S14).** When the reading moves because another app starts or stops, a single line evicts, reloads and evicts again.
- **Distance still matters, but as an order, not a limit.** "Distance is not an indicator" is true for memory. It is false for priority: the nearest patch (with bounds) is what the player stands on and sees best, so it is the last to release and the first to load.

## 5. Proposal

### Keep patch residency within the machine's live graphics-memory budget

**Change.** Today, residency is decided by the distance tier and never consults memory. A dense area can exceed a small machine's budget at any tier, and a large machine leaves gigabytes unused.

After this change, the limit on resident patch content is the graphics memory the platform reports for the whole process, against the budget the platform gives it. Distance (with bounds and prediction) only sets the order.
- While usage is under a *fill line*, patches load nearest-first. The existing band loads as today, and patches beyond it load a few at a time.
- At the fill line, no new patch starts loading.
- Above a *shed line*, the farthest resident patches that are not held are released until usage is back under it.

The effect: a world that fits loads completely, a machine whose other apps are using memory loads less, and nothing the player stands on or holds is released before everything farther away.

**Rulings kept from 205 (developer, 2026-10-08):**
- Soft and best effort: no reservation, no pre-load size estimate.
- Patch bytes are known only on completion.
- One queue, nearest-first.
- K nearest per scan beyond the band.
- Mode chosen once, before the scan.
- Dirty flags, so no check runs when nothing changed.
- A separate selection pass over saved distances.
- Text may be counted or skipped.

**Rulings this needs (see Decisions):**
- The limit is the live platform budget, not a patch-bytes cvar.
- Band admission pauses at the fill line.
- Shedding applies to any resident patch that is not held, not only memory-admitted ones.
- Two lines instead of a flip.

**Proposed design**

- **Measurement.** Reuse `CaptureMemoryPressureSample` (`Source/MEs/Performance/PerformanceClientStatRuntime.cpp:320-385`):
  - D3D12: `UsedLocal` against `BudgetLocal`.
  - Metal: `currentAllocatedSize` against `recommendedMaxWorkingSetSize`.
  - On unified memory, also the system memory pressure status.

  Give residency the latest sample. Re-read it at each residency scan and after each publication batch, not only at the 1 Hz warning cadence.
- **Lines.** Fill at 80% of the budget, shed at 90%. Leave the existing 95% warning unchanged. These are cvars for development, not player settings. On unified memory, system pressure Warning counts as being at the fill line, and Critical counts as above the shed line.
- **Mode before the scan, from the latest sample:**
  - *Under fill:* the band enters exactly as today. Beyond the band, 205's selection pass admits the K nearest non-resident records and waits for them to publish before picking the next K.
  - *Between fill and shed:* no new enters. In-flight loads finish, and ordinary leaves continue. Holds still load, since they are explicit user intent.
  - *Above shed:* farthest-first among resident records that are neither held nor pinned (live browsers). Size each step from attributed bytes so it should bring usage below the shed line, then wait for a fresh sample before shedding more, because freed memory shows up late (GC, deferred deletion, Lumen finalization; see the 104 closing comment).
- **Attribution, from 205's publication-time measurement** (`GetResourceSizeBytes` exclusive, shared files counted once), used only to:
  - size shed steps;
  - stop reload loops: the fill pick skips a record whose learned bytes exceed (fill line minus usage). Learned bytes survive unload within the session, like 111's learned bounds.

  Attribution is never used as the limit.
- **Kept from 205's design:**
  - the memory tag, so a fill-admitted patch beyond the band is not unloaded by the distance leave rule;
  - leave-under-cap conversion, so a band leave while under the fill line takes the tag instead of unloading;
  - tag drop when the player walks up to a patch;
  - same-batch ordering.
- **Dropped from 205's design:** the patch-content byte cap cvar, and the "only memory-admitted patches are released" restriction.
- **Band radius.** It stays as the "loads at once" band, so walking into a new area does not wait behind K-at-a-time picking. Memory no longer depends on it. Whether View Distance still sets it is decision D5.
- **Failure contract.** If the budget is unavailable or implausible (zero, below the pre-world baseline, or above the physical size), there is no fill beyond the band and no shedding, which is today's behavior. Log it once per session.
- **Notice.** When shedding releases a patch inside the band, show the existing graphics-memory notice once per world visit (decision D7).

**Done when**

- Deterministic tests with a synthetic budget (alongside the existing `MEs.Performance.VideoMemoryWarningTestUsagePercent` path) cover:
  - fill under the line;
  - stop at the fill line;
  - farthest-first shedding above the shed line, including band patches;
  - held and pinned patches are never shed;
  - learned bytes prevent a reload loop;
  - an unavailable budget gives today's behavior.
- On an 8 GB Mac, a startup-resume join into world 5645 and the three issue 83 worlds completes without Metal OOM, and peak process usage stays under the recommended working set. Resident and shed counts are recorded.
- On a Windows discrete GPU with a competing app holding memory, usage stays under the DXGI budget. With the app closed, more patches load.
- A world that fits loads fully at default settings, in local and cloud worlds.
- A teleport in the 22k world on an 8 GB Mac: peak usage during the burst is measured and stays under the shed line, or the overshoot is recorded.
- Standing still with no line crossed runs no scan. The range-filter benchmark shows the plain scan unchanged.

**Smaller slice (E), recommended to ship first.** Only the guard: pause at fill, shed above shed, applied to all residency, with no fill beyond the band. It protects rungs 1-3 without adding any load. The fill beyond the band (rung 6) then follows as 205's part.

**Pre-mortem (shipped and failed badly)**

| Cause | Rung |
| --- | --- |
| A join or teleport burst allocates faster than the reading updates and overshoots before admission pauses. In-flight requests are bounded only by the importer's count limit (S8) | 1 |
| Freed memory shows late, so shedding removes too much (S16) | 4 |
| External fluctuation, such as a browser video starting and stopping, causes evict-reload churn (S14) | 4, 7 |
| The budget API misreports: driver, Proton, integrated GPU (S11, S12). Too high gives a crash, too low gives an empty world | 1 or 4 |
| Non-patch growth (4K, avatars, browsers) sheds every patch silently, and the player sees an empty world without knowing why (S6) | 4 |
| A single nearby patch larger than all remaining headroom still crashes. Only an importer pre-allocation check (the closed 102) or degradation (101/103) can stop it (S7, named residual risk) | 1 |
| Lines calibrated wrongly for Windows: if D3D12 only stutters past the budget and fails later, 90% wastes content; if it fails earlier, 90% is too late | 1 or 4 |
| Filling to 80% on big GPUs raises frame time or download volume for players who never needed far content (S13, S15) | 5, 7 |
| Leaked attribution after interrupted loads. Smaller impact than in 205, because attribution only sizes shed steps | 4 |

## 6. Scenario table

Options:
- **A**: 205 as written.
- **B**: do nothing (distance tiers).
- **C**: your idea as stated: memory alone, nearest-first, process usage against 80% of detected total VRAM, one line, no setting.
- **D**: the reshaped design.
- **E**: the guard-only slice.

| # | Scenario | A (205) | B (nothing) | C (80% VRAM) | D (reshaped) | E (guard only) |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | Common: medium world, 12 GB Windows GPU, nothing else running | Fine; far fill up to the cap | Far missing (6) | Fine | Fine | Far missing (6) |
| S2 | 8 GB M1, dense 22k-world standpoint, startup resume (rung 1) | Band unguarded and fill adds more: crash if the band is near the limit (1) | Crash if the band exceeds the working set (1, unverified frequency) | 80% of 8 GB is above the 5.3 GiB working set: crash (1) | Band pauses, far band edge is shed (4) | Same as D (4) |
| S3 | 10-patch world that fits, any machine (rung 6) | All load | Partial (6) | All load | All load | Partial (6) |
| S4 | 22k world, hill, 24 GB GPU (rung 6) | Fill stops at a cap tuned for 8 GB (6, partly) | Horizon empty (6) | Fills | Fills | Horizon empty (6) |
| S5 | Windows 4 GB GPU, OBS and browser hold 1.2 GB (rung 2) | Cap does not see them; fill pushes past the budget (2, then 1) | Band may pass the budget (2) | 3.2 GB line, but only about 2.8 GB available (2/1) | Budget shrinks, far content is shed (6) | Band edge is shed (4) |
| S6 | 4K resolution plus 20 avatars, 8 GB Mac | Patch-only cap does not see it (1) | Same (1) | Sheds, wrong Mac base (4/1) | Sheds farthest, with notice (4) | Same as D (4) |
| S7 | One far patch is a 2 GiB animated image | K in flight times 2 GiB overshoot (1) | Not loaded (6) | Admitted under the line, overshoot (1) | First-load overshoot possible, learned bytes stop the reload, shed next sample; crash only if it alone exceeds headroom (1, residual) | Not loaded (6) |
| S8 | Teleport or free-camera jump, 2,500 enters and 2,400 leaves, 8 GB | Band burst unguarded and old fill still resident (1 risk) | Old plus new peak (1 risk) | Single line at 1 Hz: burst overshoot (1 risk) | Enters stop at fill, shed farthest; residual in-flight overshoot (4) | Same as D (4) |
| S9 | Standing on a large platform while usage is over the line (rung 3) | Not shed, so crash risk instead (1) | Crash risk (1) | Farthest-first, platform last | Platform last | Platform last |
| S10 | Held (inspected) far patch under pressure | Kept | Kept | Kept only if holds are respected, otherwise (3) | Never shed | Never shed |
| S11 | Windows integrated GPU, small "dedicated" figure | Fixed cap may exceed the shared budget (2/1) | Depends on Auto-Set (2?) | 80% of a tiny dedicated figure: almost nothing loads (4) | Local budget plus system pressure | Same as D |
| S12 | Budget API unavailable (Proton/vkd3d, zero) | Fills to an untested cap (1 risk) | Today | Undefined: everything or nothing (1/4) | Falls back to B | Falls back to B |
| S13 | Many small, cheap patches, big GPU (rung 5) | Loads all (5?) | Band only | Loads all (5?) | Loads all (5?) unless D1 keeps an outer limit | Band only |
| S14 | Reading moves around the line (other app toggles) | Patch-only reading, no thrash | n/a | Evict-reload loop (4, 7) | 10% gap plus learned bytes: stable | Gap: stable |
| S15 | Big GPU, slow connection, world fits (rung 7) | All download, longer bar (7) | Band only | (7) | (7) unless D8 limits fill | Band only |
| S16 | Freed memory shows late (GC, Lumen finalization) | Patch bytes drop at once, fine | n/a | Evicts until the reading drops: overshed (4) | Sized steps, waits one sample (4, bounded) | Same as D |

**Per option**

| | Contention: who else uses graphics memory, and who yields | Settings cost | Failure contract |
| --- | --- | --- | --- |
| A | Engine baseline, render targets, Lumen, the engine streaming pool (600-800 MB in DefaultScalability.ini), avatars, browsers, other processes. None of them are counted; nothing yields to them, and band patches never yield | Cap and K as cvars; View Distance as a player setting. A fixed byte cap is a machine fact left as a constant | Accounting leak lets the total drift, and the cap trips early or late. The band is never protected |
| B | Same consumers; nothing yields | View Distance carries both machine capacity and preference: a machine fact left to the user | Crash at the platform limit; the 95% warning arrives late |
| C | Same consumers, all seen through process usage; other apps are not seen through total VRAM; patches yield | None | No defined behavior when detection fails or misreads |
| D | All consumers in the process seen directly. Windows other apps through the DXGI budget, Mac other apps through system pressure. Patches yield farthest-first; holds, pinned browsers, avatars and engine memory do not | No memory setting. Fill and shed fractions are design constants. A band setting earns its place only if D1 rules frame rate matters: a player who wants frame rate versus one who wants a long view, on the same machine | Unavailable or implausible budget gives B. Exceeded anyway gives a shed next sample; a single oversize near patch can still crash (residual) |
| E | As D, but with no fill | As B, plus the guard constants | As D |

## 7. Measurement

| Control | Rung it protects | Proxy for | Class | Source |
| --- | --- | --- | --- | --- |
| Resident set = all records (step 0) | 3, 4 | "Content the player may be near" | Proxy: diverges on memory (rungs 1, 2) | PatchReplication.md ruling 2026-09-14 |
| Load / unload radius 25,000 / 31,000 uu | 1, 2, 5 (intended), 4 | Memory and render cost per machine; nearness | Proxy: memory diverges with density (105: bytes hardly move across tiers); frame time barely moved in 104 | `Source/MEs/_Patch/Managers/PatchMaterializer.cpp:37-44` |
| Unload hysteresis (1.25x) | 4 (boundary churn) | Player oscillation at the boundary | Direct for its job | Same file; `LyraSettingsLocal.cpp:826-838` |
| Minimum resident time (ruled, omitted) | 4 | Churn | Not built | 104 closing comment |
| Pivot tolerance 500 uu | Scan CPU cost (5) | Viewpoint movement | Direct for its job | `PatchMaterializer.cpp:47` |
| View Distance tiers 150/250/400/500 m | 1, 2, 5 | Machine capacity | Proxy: Auto-Set benchmarks speed, not memory; tiers do not move memory (105) | `Source/MEs/Settings/LyraSettingsLocal.cpp:826-838` |
| Bounds proximity (111) | 3 | Geometric nearness | Direct when bounds are known, proxy (pivot) when not | Issue 111, `PatchResidencyFilter.h` |
| Prediction 2 s / 25,000 uu | 4 | Where the player will be | Proxy (velocity extrapolation) | `PatchLoadSubsystem.cpp:63-67` |
| Teardown/spawn frame budget | 5 (hitches) | Game-thread time | Direct | `PatchLoadSubsystem.cpp:120` |
| 95% warning, 5 x 1 s | 1, 2 (informs only) | Process headroom | Direct reading but late; cannot stop a burst | `PerformanceClientStatRuntime.cpp:85-89, 1095-1120` |
| 205 patch-content byte cap | 1, 2 | Process headroom on this machine now | Proxy: misses baseline, resolution, avatars, browsers, other apps, machine size | Issue 205 |
| 205 K = 8 in flight | 1 (overshoot) | In-flight bytes | Proxy: one patch can be gigabytes (83: about 2.46 GiB of animated frames per world) | Issue 205, issue 83 |
| `GetResourceSizeBytes` per patch | 1 (attribution) | Allocation a patch causes | Proxy, close for textures (85-97% per 83); unchecked for meshes. Used only for attribution in D | `AssetReferenceAuditCommandlet.cpp:182` (existing use); issue 83 |
| 80% of detected VRAM (C) | 1, 2 | OS budget for this process | Proxy: misses other apps, integrated GPUs, Mac unified memory | Your idea |
| D3D12 `UsedLocal` / `BudgetLocal` (D fill/shed) | 1, 2 | n/a | **Direct**: "OS-provided video memory budget... the application should target. If CurrentUsage is greater than Budget, the application may incur stuttering" | `PerformanceClientStatRuntime.cpp:330-345`; learn.microsoft.com DXGI_QUERY_VIDEO_MEMORY_INFO |
| Metal `currentAllocatedSize` / `recommendedMaxWorkingSetSize` | 1, 2 | n/a | **Direct**, process-level. Apple describes the working set as how much the device can allocate without hurting performance. Static: it does not shrink when other apps use RAM, hence the system pressure reading | `PerformanceClientStatRuntime.cpp:347-360`; Apple MTLDevice docs (not re-fetched) |
| System memory pressure status (unified memory) | 1, 2 | n/a | Direct on Mac; unverified on Windows | `PerformanceClientStatRuntime.cpp:323` |
| D learned per-file bytes | 4, 7 (thrash) | Allocation on reload | Direct after first load, unknown before | Proposed |
| Pre-allocation reservation (102, closed) | 1 (single oversize patch) | n/a | Would be direct; not built | Issue 102 |

## 8. Decisions for the user

1. **Frame rate against nearby content and long view (rungs 4, 5, 6 are assumed).** Does frame rate still justify a distance limit?
   - (a) Memory is the only limit, and the band is a fixed design constant: everything that fits loads.
   - (b) View Distance keeps an outer patch radius for players who prefer frame rate.

   This changes S13 and S4. 104's own numbers (3% frame-time change for ten times fewer actors) lean toward (a); a frame-time measurement in a count-heavy world would settle it.
2. **Overturn 205's rulings "distance admission unchanged, never consults memory" and "only memory-admitted patches are released."** D and E need both to protect rung 1 in S2, S5, S6 and S8. Keeping them leaves the band, which is where bursts come from, unguarded.
3. **Overturn "flip at the boundary, no hysteresis."** That ruling assumed a patch-only total that only patches move. A live budget moves with other apps.
   - (a) Two lines (D).
   - (b) One line plus the learned-bytes skip only. Simpler, with more churn in S14.
4. **The 104/105 ruling "loading everything is reachable only through console variables; no unlimited tier."** Its premise was memory, which D now enforces directly. D loads a fitting world fully by default. 205 already noted this consequence without a ruling. Confirm or reject.
5. **What View Distance means for patches (105 placement ruling).**
   - Keep it as the band radius (pacing only).
   - Keep it as the outer limit from 1(b).
   - Return it to engine-only meaning.
6. **Residual single-patch overshoot (S7).**
   - Accept it.
   - Revive an importer pre-allocation check (102), or degradation such as animated to static frame and downscaling (101/103, closed not planned on 09-25).

   This is a rung question: is degraded nearby content better than missing content or a crash risk?
7. **Notice when shedding removes nearby content (S6).** Show the existing graphics-memory notice once per visit, or stay silent. Issue 83 wanted reductions explained to the player.
8. **Cost of filling (rung 7 ranked last is assumed, S15).** Does download, heat and progress-bar time really rank below distant content? If so, decide whether fill should load only after the band settles, only from cached files, or count in the initial progress bar (205 counts it). It also affects CDN egress.
9. **Sequencing.** Ship E (the guard) first, then the fill, or ship D at once.

**Unverified facts (check before building)**

- Whether Mac and Windows graphics-memory crashes continued after 104 and 105 reached players. Check MES-100 and MES-WT recurrence in Sentry. This decides how urgent rung 1 is under today's band (S2).
- Whether the default band at dense standpoints exceeds 5.3 GiB on an 8 GB Mac. 104's 15.5 GiB is RHI accounting on a development machine, not physical use.
- Where Windows actually fails relative to the DXGI budget. Microsoft documents stutter past the budget, and the engine terminates on E_OUTOFMEMORY. This sets the Windows shed line.
- The cost of reading `RHIGetMemoryStats` and `currentAllocatedSize` on each scan.
- Whether the system pressure status is meaningful on Windows.
- How Proton/vkd3d reports the budget.
- Whether `BudgetLocal` on integrated GPUs reflects shared memory.
- Whether a record carries any byte size before import. Replicated "content size" is a geometric extent (`PatchReplicationState.h:168`); 205's ruling says nothing is known.
