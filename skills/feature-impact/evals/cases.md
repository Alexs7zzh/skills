# Feature impact behavioral checks

Run each task in a fresh context. Give the agent the installed skill and the task input, but not these scoring notes, prior answers or the maintenance discussion. Inspect its tool trace as well as its answer. Do not count an item merely because a keyword appears: it needs the condition and consequence. These are source-inspection exercises, not runtime bug proofs.

## Original workflow

Use a checkout with a feature that separates durable records from client-local loaded objects. Describe only the before/after behavior and ask which related features need updating. Do not name expected consumers or provide a prior map. The motivating prompt concerned patch residency in MEs, including the extension from cloud worlds to local and file-system worlds; a private checkout is needed for that exact replay.

Check that the agent follows record-based queries through result activation, examines interaction lifetimes, searches beyond the implementation module, and retains smaller tooling and measurement implications in its answer. A missing UI or asset boundary must remain an explicit candidate. Check whether an intentional setting's downstream measurement effect survives classification. Do not score an accepted tradeoff as a confirmed bug. Record code revision or the live-workspace limitation when comparing runs.

For a focused framing check, give the same before/after description and ask for the initial research handoff, with no consumer code available. Expect an explicit assumption table before delegation: complete records versus incomplete loaded objects, client ownership, newly partial local/file-system worlds, and the resulting availability/lifetime questions. Both provided and lost guarantees need consumer questions. Unknown admission exceptions and readiness remain unknown. Every research cluster has an owner; synonymous formulations do not require separate readers. This checks the handoff, not discovery recall in a real repository.

The selected feature is a constraint. Resource retention and work continuing after eviction remain valid impacts. Replacing distance admission with a resource-budget or count policy is feature design and is outside this skill. Theme 15 in the historical coverage matrix is excluded from active scoring; the active denominator is 29. Preserve historical scores separately.

## Unseen sibling

Prompt: "Use $feature-impact. Export generation now runs as a queued job for both personal and team workspaces; it used to return a completed file synchronously. What else needs attention? The source bundle is async-export.md."

Expected useful candidates:

- History lists all jobs, but activating an incomplete result silently does nothing.
- Scheduled email announces completion without waiting and sends an empty link.
- Batch download still consumes the initial response as a completed artifact.
- The count's UI label promises ready downloads while the count includes queued work.
- Counter-to-card wiring is not shown. Keep that connection unresolved rather than calling it a verified defect.
- Cancellation hides a row once, but polling can recreate it before the persistent delete completes.
- The benchmark measures request acceptance while labelling it completion time.
- Saved artifact URLs can expire. Intentional retention policy does not make the reopen action unaffected.
- Documentation still promises synchronous completion.
- The unavailable dynamic retry handler is unresolved, with a targeted follow-up.

The export dialog already waits correctly. Do not propose reimplementing the worker or describe all export workflows as broken. Do not limit the effect to team workspaces, require issue searches, or silently drop smaller findings. Keep queued generation and the chosen retention policy as constraints, while retaining consumer choices such as waiting for completion or regenerating an expired download. This case checks timing and completion, not the motivating project's object residency.

## Known-good concept replacement

Prompt: "Use $feature-impact. Region visibility now uses polygon bounds rather than label-anchor distance. What related features should change? The source bundle is region-bounds.md."

Expected: load ordering can use distance to bounds; hover prefilter can miss a large region containing the pointer; the visibility debug overlay represents the old rule. Label placement and authored bookmarks still need anchors. Editing and remote receipt already recompute bounds; no missing wire field should be invented. Both map modes share the consumer behavior. The core visibility function is feature-owned work.

## Indirect consumers

Prompt: "Use $feature-impact. The settings editor now mounts only fields near the viewport while retaining every schema field and draft value. What else needs attention? The source bundle is virtualized-form.md."

Expected: unmounting removes controls from a registry consumed by submission and validation. Both omit offscreen fields despite the complete store. The save command never names the virtualizer, so symbol-only searching is insufficient. Export reads the full schema/store and remains correct. Search activation already scrolls and waits for mounting under the supplied assumptions; do not invent a selection failure just because another fixture had one.

## Downstream effects and changed state

Prompt: "Use $feature-impact. Our lighting app now limits delivered brightness per room while keeping each lamp's requested brightness for later restoration. Previously requested and delivered brightness were the same. What related workflows need attention? The source bundle is lighting-limits.md."

Expected useful candidates:

- Follow delivered brightness into electrical demand and then battery reserve. `demandWatts` still uses requested brightness. With an active ceiling below the request, it overestimates draw, so `minutesRemaining` understates runtime. The battery status label promises runtime at current brightness and becomes misleading.
- Preserve the separate consequence in `enterBackup`: the same estimate can refuse backup operation even when the delivered brightness would meet the minimum reserve. The reserve consumer never names the ceiling, so stopping at the lighting controller or energy estimator misses it. Grouping both consequences under one cause is fine; dropping either is not.
- Join vacancy suspension with ceiling changes. Suspending stores the old delivered output, changing a ceiling while suspended does not replace that value, and resume publishes it directly. Lowering the ceiling can restore output above the current limit until another adjustment; raising it can leave output below the currently requested and permitted brightness. Ordinary adjustment already clamps correctly and does not need reimplementation.

Scenes intentionally persist requested preferences and recall through `setRequested`, so scene recall under the current ceiling is already correct for active lamps. Recalls while suspended can join the existing vacancy-resume candidate; do not invent a second missing scene clamp. The requested-brightness slider reports the value its label promises. The live meter reads actual draw and remains correct. Do not treat every energy path or every stored requested value as broken. Sources show the required demand-to-reserve wiring, so that connection is evidenced, not unresolved.

## Invocation checks

Show only the description and ask whether these requests need this skill. Use a fresh context without the body or expected answers.

- "We moved notifications from per-device to per-account. Which other behavior might we have missed?" Yes.
- "Before we implement inherited team permissions, map the other workflows affected." Yes.
- "The loading change shipped yesterday. What else needs updating?" Yes.
- "Fix this null dereference in the selected click handler." No, ordinary diagnosis and implementation.
- "Should we limit cache size by bytes, entry count or age? Help design the policy." No, standalone design choice without an impact-mapping request.
- "Rename this helper and update its direct callers." No, mechanical implementation.
- "My skill at reading stack traces needs work. Explain this trace." No.

## Assessment

For each run, preserve the prompt, skill version, agent/model when available, outcome and observable searches/reads. Distinguish discovery failure, unsupported classification and synthesis loss. Repeat the realistic case to expose variation; a passing fixture or a single replay is not evidence of identical results across models.
