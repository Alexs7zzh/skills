# Feature shaping: issue 205, patch loading under graphics memory

## 1. Outcome

The game never quits mid-session for lack of graphics memory, on any Mac or PC, in any world. What is underfoot and nearest stays; a machine with room also shows the rest of the world without delaying nearby content.

## 2. Verdict on the proposal

**205 as filed partly delivers.** Fills spare memory (S2, S3) but misses the top rung:
- **S4:** distance loads never consult memory, so the nearby band alone can overrun an 8 GB Mac. The 22k world held 15.5 GiB of RHI accounting at default range (104; *unverified* as physical memory).
- **S5:** bytes are counted only after loading finishes, and K loads are in flight. One patch can hold 2.46 GiB (83).
- **S6, S7:** a fixed patch-only cap ignores other apps, avatars and browsers.
- **S9, S10:** fill may delay nearby loads or hold loading progress open (*unverified*).

**80% of VRAM: right goal, wrong measure.** Apple silicon has no VRAM figure, and 80% of 8 GB exceeds Metal's recommended working set, where 83 saw crashes (S8). On Windows, other apps share the card (S6). The client already samples the OS budget and usage each second (D3D12 `BudgetLocal`/`UsedLocal`, Metal `recommendedMaxWorkingSetSize`/`currentAllocatedSize`; `/Users/alex/dev/MEs/Source/MEs/Performance/PerformanceClientStatRuntime.cpp`).

**Distance** poorly predicts memory (flat across 105's tiers) but directly measures what the player needs first (111, 196): distance orders, memory limits.

**No residency rule alone can guarantee no crash.** Only texture creation sees exact bytes before allocating. 83 approved accounting there; I found no implementation (*unverified*; I did not read 83's sub-issues).

## 3. Proposal (205's form)

### Change
Patches fill memory nearest-first up to live device headroom; when short, non-held patches yield farthest-first.
- **Detected ceiling.** On each 1 s sample, `PatchCeiling = Budget × m − (Used − PatchBytes)`. The value m = 0.9 is a *placeholder*. PatchBytes is 205's publication accounting. No setting.
- **One order.** 205's selection pass, K and dirty flags stay. Fill is admitted only when the band has no pending entries.
- **Yield.** Over the ceiling, release the K farthest non-held resident patches. Holds, live browsers, carried placement and the patch underfoot never yield.
- **No churn.** Skip any record whose last measured size this session exceeds headroom.
- **Allocation guard (83, Decision 2).** A patch texture that would exceed headroom becomes static, then downscaled, then is skipped.
- **Progress.** Fill never holds progress or readiness open.
- **Fallback.** With no readable budget, behaviour is today's band, logged once.

### Done when (205's items stay; replace its cap items with)
- An 8 GB M1/M2 Mac at the densest point of the 22k world does not exit, and usage settles under the ceiling.
- On Windows, another process taking memory makes patches release farthest-first, with no exit.
- A patch too big on its own degrades and play continues.
- Band load time after a teleport is no worse with fill on.

**Pre-mortem:** late frees (GC, Lumen) cause over-eviction and refill (R7, S15). Metal fails below the working set when RAM is tight (R1). With no guard, S5 still exits (R1). Fill costs frame time (R5, S13). Windows budget swings cause churn (R7). Leaked bytes cause drift (R6 or R1).

## 4. Decisions for the user

1. **Overturned:** "distance never consults memory; release only memory-admitted patches." S4 breaks its premise. (a) The band yields, leaving nearby holes. (b) The band stays protected, and dense worlds still exit.
2. **Overturned in part:** "soft cap, no reservation" as the only protection. (a) Add the importer guard, which widens scope into CommonImporter and 83 and needs your go-ahead. (b) Skip it, and S5 and burst exits remain.
3. **Overturned:** "load-all only through console variables" (104, 105). Cost is now bounded. Accept it, or keep the tier as the fill's outer limit.
4. **View Distance:** (a) it chooses the band; (b) it drops its patch meaning, leaving engine scalability; (c) it caps fill distance. A setting needs two players on one machine who want different values, which happens only if far patches cost frame rate, battery or bandwidth. Measure all-loaded against band frame time after Lumen settles; 104's 39.2 vs 38.0 ms was confounded.
5. **Windows rollout.** D3D12 pages memory out before it fails: the engine OOM fixture shows 13.6 GB used against a 7.4 GB budget. So the ceiling mainly prevents stutter, and the fatal `TerminateOnD3D12OutOfMemory` sits further out. Frequency is *claimed*; check Sentry for "Out of video memory".
6. **Notice when nearby content is released (R8):** the existing pressure dialog, a quieter indicator, or a log line.
7. **Assumed order:** R2 against R3, R4 against R5, and where R7 and R8 sit.
8. **Adjacent:** non-patch memory over budget by itself (crowds, pinned browsers); startup resume into a crashing world (84); fill bandwidth on metered links.

## 5. Idea chain

| Step | Problem it answered | Evidence | Control (commitment) |
| --- | --- | --- | --- |
| Start | none | none | none: every record materialized |
| 104 distance residency | High frame time and memory with 22k actors | 104: RHI 30.9 to 15.5 GiB; frame 39.2 to 38.0 ms with Lumen confound | 25k/31k uu pivot radius, two viewpoints, nearest-first batch, paced teardown, browser pin (ruling) |
| 105 tiers | Players cannot change the range | Claimed; 105's own data shows memory flat across tiers | View Distance at 150/250/400/500 m, unload 1.25× (ruling) |
| 111 bounds | Platform unloads under the player | Developer-assigned case in 104 | Bounds proximity, flag off by default (ruling) |
| 83 budget | Mac exits past Metal working set | MES-100: 37 processes, 9 users, 8 GB M1/M2; textures 85-97% of growth | 95% for 5 samples warning; pre-allocation accounting approved, not found in code |
| 205 memory fill | A machine with room shows only nearby content | Claimed scenarios; 105: 35-231 visible objects unloaded | Patch-byte cap cvar, K=8, soft cap, measure on publish, distance untouched, evict memory-admitted only (rulings); progress and leave conversion (proposal) |
| Your idea | Running out of memory, Windows above all | Mac exits evidenced; Windows OOM is fatal in engine code, frequency claimed | 80% of detected VRAM, no setting (proposal) |

## 6. Experience ladder

| Rung | Scenario | Why above the next |
| --- | --- | --- |
| R1 Game exits, session lost | 8 GB Mac joins a dense world | Everything is lost, and startup resume can repeat it |
| R2 Ground or held object vanishes | Platform underfoot or a live browser released | Player loses footing or action, not just view (*assumed* over R3) |
| R3 Heavy stutter from paging | Windows over budget pages to system memory | Play degrades everywhere (*assumed*) |
| R4 Waiting | Nearby band late after teleport; progress held open by fill | Blocks the player's next action (*assumed* over R5) |
| R5 Lower frame rate, battery, bandwidth | 22k patches resident on a big GPU | Continuous cost, but play continues (*assumed*) |
| R6 Distant content missing that the machine could hold | Small world or hilltop view | Lost view only |
| R7 Pop-in churn | Patch at the margin loads, releases, reloads | Distracting, transient (*assumed*) |
| R8 No explanation for missing content | Band released under pressure | Confusion only (*assumed*) |

## 7. Scenario table

Options: A = 205 as filed; B = do nothing; C = your idea (fixed cap at 80% of detected VRAM, no setting); D = reshaped; E = smaller slice (D without fill beyond the band).

| Row | A | B | C | D | E |
| --- | --- | --- | --- | --- | --- |
| S1 Common: medium world, spare memory | Fine | R6 at edges | Fine | Fine | R6 at edges |
| S2 Ten-patch world | All load | R6 | All load | All load | R6 |
| S3 Hilltop, 16 GB GPU | Fixed cap tuned for 8 GB Mac: R6 | R6 | Fills to 12.8 GB, fine | Fills to headroom | R6 |
| S4 Dense band, 8 GB Mac | R1 | R1 | 6.4 GB over working set: R1 | Band trims: R8 | R8 |
| S5 One 2.46 GiB animated patch | R1 | R1 | R1 | Guard degrades it: R6 | R6 |
| S6 Windows, other app takes VRAM | R3, then R1 | R3, then R1 | R3, then R1 | Ceiling drops, releases: R6 | R6 |
| S7 Crowd, many avatars and browsers | R1 risk | R1 risk | R1 risk | Patches yield: R6 | R6 |
| S8 Unified Mac or integrated PC GPU | Cap may not fit device | Today's risk | Mac R1; integrated PC loads almost nothing: R6 | OS budget fits device | Fits |
| S9 Teleport with fill in flight | R4 (*unverified*) | Fine | R4 | Fill paused while band pending | Fine |
| S10 Join, 24 GB GPU, 22k world | R4 if fill counts as progress | Fine | R4 | Fill outside progress | Fine |
| S11 Patch underfoot while over ceiling | Fine (band never evicted) | Fine | R2 unless holds respected | Held, fine | Fine |
| S12 Margin patch reloaded | R7 risk | Fine | R7 risk | Size-skip prevents | Fine |
| S13 All 22k resident | R5 unmeasured | Fine | R5 | R5 unmeasured, Decision 4 | Fine |
| S14 Budget unreadable | Cvar cap still works | Fine | No reading: undefined | Falls back to B | B |
| S15 Late frees | Accounting unaffected | Fine | n/a | Over-evict: R7 risk | R7 risk |
| S16 Band released under pressure | Never, exits instead | Never | Silent holes: R8 | R8, Decision 6 | R8 |

| Option | Contention (graphics memory, importer slots) | Settings cost | Failure contract |
| --- | --- | --- | --- |
| A | Fill yields to band only via eviction; band, avatars, browsers and other apps never yield | Cap and K cvars; the cap is a device fact that should be detected | Undercounted bytes or wrong cap: R1 on small devices, R6 on large |
| B | Nothing yields | View Distance | Dense worlds: R1 |
| C | Patches yield to nothing outside the fixed cap | None, but the 80% is a constant | Wrong or absent VRAM reading: R1 or R6 |
| D | Non-held patches yield farthest-first to all other users; fill yields importer slots to the band | None added; m is a developer constant; View Distance per Decision 4 | No budget: B. Stale sample: 1 s lag, backed by the allocation guard. No guard: S5 is R1 |
| E | As D, without fill | As D | As D |

## 8. Measurement

| Control | Rung | Stands for | Measured | Source |
| --- | --- | --- | --- | --- |
| Load/unload radius, tiers | R2, R6, R5 | What the player sees and uses; assumed memory bound | Proximity direct; memory not measured, flat across tiers | `PatchMaterializer.cpp` cvars; `LyraSettingsLocal.cpp` `ApplyPatchResidencyRange`; 105 |
| Nearest-first batch | R4, R2 | What the player needs first | Estimated from pivot or bounds; large far-pivot platforms diverge | 104, 111 |
| Teardown frame budget | R3, R5 | Itself | Direct, ms per frame | `MEs.PatchLoad.FrameBudgetMs` |
| Browser pin and residency hold | R2 | Itself | Direct, live CEF instance or hold | 104, `PatchResidencyHold.h` |
| Bounds proximity flag | R2 | Geometry near the player | Estimated; unknown bounds fall back to pivot | 111 |
| 95% for 5 samples warning | R1 | Imminent device failure | Direct OS figures but late; bursts cross in under 5 s; on Windows the budget is not the failure point | `PerformanceClientStatRuntime.cpp` |
| 205 cap (bytes cvar) | R1, R6 | Device headroom available to patches | Estimated, patch-only; S4, S6, S7, S8 diverge. Real quantity is direct: OS budget minus usage | Same file |
| 205 per-patch bytes | R1 | That patch's resident graphics bytes | Estimated; misses the distance-field atlas, shared files, late frees; textures 85-97% | 205, 83, `CommonImporterRuntimeLumen.md` |
| 205 K per scan | R1, R4 | Bytes in flight | Estimated; one patch is 2.46 GiB. Direct at texture creation (83) | 83 |
| 205 distance never consults memory | R2, R4 | "Band is always affordable" | Diverges in S4 | 104 comment |
| 205 evict memory-admitted only | R2 | Band protection | Diverges in S4 | 205 |
| 205 soft cap, flip at boundary | R7 | Itself | Direct | 205 |
| 205 dirty flags, mode before scan | R5 (idle cost) | Itself | Direct, scan skipped when nothing changed | 205; range-filter benchmark |
| 205 text counted or skipped | R1 | Text texture bytes | Direct if counted; skipping undercounts, which the live bracket absorbs in D | 205 |
| Two viewpoints and join fallback | R2, R6 | Where the player is and looks | Direct, avatar and camera positions | 104 |
| No player setting (your idea) | n/a | Rule: the device budget is readable, so it is detected | Settings cost; see Decision 4 for View Distance | `PerformanceClientStatRuntime.cpp` |
| 80% of detected VRAM | R1 | Headroom | Estimated; S4, S6, S7, S8 diverge; real quantity direct | `PerformanceClientStatRuntime.cpp` |
| D margin m = 0.9 | R1, R3 | Gap between OS budget and failure or paging | *Placeholder*: measure Metal exits against working set on 8 GB M1/M2, and Windows paging onset against `BudgetLocal` | 83; engine `D3D12Util.cpp` |
| D size-skip | R7 | That record's bytes | Direct within a session | 205 accounting |
| D fill only when band idle | R4 | Itself | Direct, empty entering batch | Materializer |
| D allocation guard | R1 | Itself | Direct, exact texture bytes before allocation | 83 |
