# Feature impact behavioral checks

Run each task in a fresh context. Give the agent the installed skill and the task input, but not these scoring notes, prior answers or the maintenance discussion. Inspect its tool trace as well as its answer. Do not count an item merely because a keyword appears: it needs the condition and consequence. These are source-inspection exercises, not runtime bug proofs.

## Original workflow

Use a checkout with a feature that separates durable records from client-local loaded objects. Describe only the before/after behavior and ask which related features need updating. Do not name expected consumers or provide a prior map. The motivating prompt concerned patch residency in MEs, including the extension from cloud worlds to local and file-system worlds; a private checkout is needed for that exact replay.

Check that the agent follows record-based queries through result activation, examines interaction lifetimes, searches beyond the implementation module, and retains smaller tooling and measurement implications in its answer. A missing UI or asset boundary must remain an explicit candidate. Check whether an intentional setting's downstream measurement effect survives classification. Do not score an accepted tradeoff as a confirmed bug. Record code revision or the live-workspace limitation when comparing runs.

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

The export dialog already waits correctly. Do not propose reimplementing the worker or describe all export workflows as broken. Do not limit the effect to team workspaces, require issue searches, or silently drop smaller findings. This case checks timing and completion, not the motivating project's object residency.

## Known-good concept replacement

Prompt: "Use $feature-impact. Region visibility now uses polygon bounds rather than label-anchor distance. What related features should change? The source bundle is region-bounds.md."

Expected: load ordering can use distance to bounds; hover prefilter can miss a large region containing the pointer; the visibility debug overlay represents the old rule. Label placement and authored bookmarks still need anchors. Editing and remote receipt already recompute bounds; no missing wire field should be invented. Both map modes share the consumer behavior. The core visibility function is feature-owned work.

## Indirect consumers

Prompt: "Use $feature-impact. The settings editor now mounts only fields near the viewport while retaining every schema field and draft value. What else needs attention? The source bundle is virtualized-form.md."

Expected: unmounting removes controls from a registry consumed by submission and validation. Both omit offscreen fields despite the complete store. The save command never names the virtualizer, so symbol-only searching is insufficient. Export reads the full schema/store and remains correct. Search activation already scrolls and waits for mounting under the supplied assumptions; do not invent a selection failure just because another fixture had one.

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
