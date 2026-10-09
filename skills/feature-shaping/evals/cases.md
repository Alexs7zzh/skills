# Feature shaping behavioral checks

Run each case in a fresh context, once on Claude Opus 5.5 and once on GPT 6.1 Sol. Give the agent the installed skill and the task input, never these notes. Inspect the tool trace as well as the answer. Score a finding only when its condition and consequence are both present, not when a keyword appears. Record the skill version with each run.

## Patch memory admission (origin case, large input)

Checkout: the MEs Unreal client, with its tracker issues 83, 104, 105, 111 and 205 readable, or exported to files when the sandbox has no network. Issue 205's body changed on 2026-10-09; for a replay of the original run, use the 2026-10-08 body from its edit history.

Prompt: "Use $feature-shaping on issue 205. My thinking so far: we started by loading only patches near the player because loading everything hurt performance. Then VRAM was still tight and machine-dependent, so we added distance tiers. Then I realized that if memory is what matters, a machine with free memory should load more regardless of distance, which is issue 205. Now I think what we really care about is only not running out of VRAM, especially on Windows where allocation failure crashes; fewer patches beats a crash. Distance is not an indicator of anything since worlds differ in density. Maybe we should auto-detect VRAM and use 80% of it, and maybe no user setting at all. I am not sure my current idea is right; dig to what actually matters and propose."

Expected:

- Idea chain with five rows: load everything, pivot distance (104), tiers (105), bounds (111), byte cap (205), each with evidence and controls.
- Ladder whose top rung is a fatal allocation failure, then stutter from memory paging, then frame rate, then missing nearby content, then missing far content, with frame rate against missing content marked assumed.
- Distance identified as a proxy that orders loading. Issue 104's completion comment measured 39.2 to 38.0 ms mean frame time after resident actors fell from 22,107 to 2,076 with Lumen active, so a frame-rate claim for distance is weak. Either keeping a distance or count control with that caveat, or sending "does patch count justify a distance limit" to the user, passes. Asserting that distance protects frame rate without the measurement, or accepting "distance is not an indicator of anything", fails.
- The fixed patch-byte cap identified as a proxy for the device budget, with divergence cases: engine baseline and non-patch consumers not counted; a default tuned on one machine wrong on a smaller card and wasteful on a larger one; on Windows other applications shrink the budget.
- Measurement classified direct: the client samples the D3D12 local budget and usage and the Metal recommended working set and allocated size in `PerformanceClientStatRuntime.cpp`, with a test console variable that fakes usage. Per-patch bytes classified estimated.
- Reshaped proposal in the issue's form: fill and release lines on the sampled device usage, farthest released first, fixed cap only as fallback, no player-facing memory setting because the budget is a detectable fact. Nearest-first ordering, soft limit and measure-on-completion kept from the original.
- The 2026-10-08 ruling "distance admission never consults memory" marked overturned and sent to the user, not decided.
- Scenario rows at least for: a small world on a large machine; a large world on an 8 GB Mac; one cap default on a small and a large Windows card; a browser opened or avatars joining after the fill; budget metric unavailable; dense content near the player exceeding the budget under distance admission alone.
- Settings cost: the tier setting kept where two users on one machine differ on frame rate against distant content; the memory fraction not offered to players.
- Fill and release fractions marked as placeholders with the measurement that would set them.
- Sections 1 to 4 under 800 words.

Fails: adopting 80% as a fact; a cap expressed only in patch bytes; deciding the rung order or the overturned ruling for the user; editing the issue; a report that reaches the verdict after the tables.

## Second domain, small input

Prompt: "Use $feature-shaping. We want a 'recently visited places' list on the home screen of our app. Last five places, most recent first. Is that the right thing to build?"

Expected: a one- or two-row idea chain with the problem marked claimed; a ladder about getting back to a place the user cares about; recency identified as a proxy for return intent with a divergence case (a place visited once by accident ranks above one visited daily); the count and the order marked as placeholders or as the user's constraint; a settings-cost line saying the count is picked by the design; "build it at all" raised as a decision because no evidence was given. Needs the proposal would not change, such as recovering a lost session or hiding history from onlookers, are adjacent: one line each under Decisions, absent from the design and the ladder. Sections 1 to 4 under 400 words.

Fails: a reshaped design with session recovery, a history page, server storage or telemetry; adjacent needs on the ladder; a report whose first four sections exceed 400 words.

## Different domain, keep as is

Prompt: "Use $feature-shaping. Our deploy CLI applies changes directly. Add a --dry-run flag that prints what would change without applying. Is that the right thing to build?"

Expected: the flag identified as a mode control; a ladder whose top rung is production changed in a way the operator did not expect, then a preview that differs from the real apply (false confidence), then a noisy preview, then deploying to staging just to look; a divergence case for the preview (state drifts between preview and apply, or a step the preview skips); the verdict "delivers" or "partly delivers" with the drift row named; the proposal either "keep as is" with a failure contract for drift, or a small addition that the printed plan is what gets applied. Approval gates and rollback are adjacent.

Fails: a reshaped design that adds approval workflows, rollback or audit logging; a scenario table with rows the flag cannot affect; more than one option beyond the original and do nothing when no row fails the original.

## Boundary

Prompt: "Use $feature-shaping on the dry-run flag above and implement it."

Expected: the report, and a statement that implementation is outside this skill. No files changed.

## Invocation

The skill is user-invoked. Show only the description to a fresh context and confirm that it reads as a summary a human picks by name, not a trigger list.
