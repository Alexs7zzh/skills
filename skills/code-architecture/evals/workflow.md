# Bounded architecture workflow checks

Use fresh agent contexts and the runtime/evaluator separation in SKILL.md. Keep prompts, supplied facts/source, exact skill version and observed outputs in the maintenance run. Give agents the workload and requested outcome, not the expected answers below. Stop a trial when a meaningful workflow failure appears, preserve it, then repair before retrying. These cases test the workflow; they do not authorize edits or runtime launches in an unrelated project.

## Research completeness and the research only boundary

Prompt: research a small upload subsystem for responsibility boundaries, capability contracts and timed state. Produce the account only.

Fixture: a provider supplies an expiring upload lease; a queue carries only its duration and a consumer starts expiry on receipt. A tracing decorator inherits a default no-op for a session tag while forwarding upload operations. A function named EmitProgress also returns reserved capacity. Supply source for the concrete composition, writers and consumers, with a separate harmless reporting-only function and a genuinely optional provider hook.

Expected: the report explains the lost time origin, exact missing forwarding and capacity-return side effect as facts, without claiming all wrappers are transparent or all reporting is pure. It distinguishes the harmless siblings and optional capability. Each requested principle section works with the orientation. The researcher stops after the account without reviewing, proposing a fix or launching checks.

## Combined review and a concrete handoff

Prompt: review a supplied factual account using whole-account and independent selected-principle reviewers, then combine the results into concrete remedies. Project edits are not requested.

Fixture: a non-voice cache retains a TTL through delayed delivery; a required decorator capability is omitted; another composed path correctly forwards it. Include a bounded policy timeout whose optimal magnitude is unknown, and a resource whose logical retirement precedes destruction. Supply complete facts and goals, with enough irrelevant source to expose unnecessary revalidation.

Expected: the whole and distinct principle reviewers stay blind until synthesis and trust the supplied facts. No routine source or hash rewalk occurs. The combined output merges duplicate mechanisms without losing distinct facets, distinguishes accidental and structural causes, and selects a sufficient remedy rather than insisting on a named pattern. The policy timeout remains an evidence gap unless a violated requirement is supplied. The handoff names patch boundaries, a discriminating delayed-delivery/composition check and any real decision still open. No project source edits occur.

## Unseen sibling and known good paths

Vary the timed fact to a permission observation and the wrapper to a persistence adapter. Change data names and operation order. The same trace requirements should expose old observations made fresh on receipt and an inherited missing commit notification.

Give a separate account where an absolute expiry survives delivery, the consumed capability is explicitly forwarded and cleanup has an explicit lifecycle operation. Expect no invented structural finding, no generic framework and no source dive merely to reconfirm the trusted account.

## Routing and authority near negatives

- A research-only request stops before review even though review.md exists.
- A review with one explicitly requested reviewer does not launch a full specialist cohort.
- A mechanical spelling correction does not invoke the architecture workflow implicitly.
- A user-requested fix continues from the selected handoff under project rules; it does not pause merely because a previous stage was read-only or because the correction uses a small type.
- An unknown provider guarantee remains a named limit; it does not authorize changing the provider or scheduling a runtime experiment.

Record the original case, changed sibling, near negative and known-good result separately. Static prompt classification does not prove execution of the combined review or research workflow.

## Logging account and policy precedence

Prompt: research an SDK diagnostic relay with a logging focus, then independently review the factual account. Select principle 33. Do not give researchers or reviewers the incident diagnosis.

Fixture: an external transport emits category, message and native level, including Warning/Error/Fatal. Project policy requires a particular connection-failure signature at Warning to distinguish transport failure from a silent SDK operation. Ordinary chatter is local at Log; unrelated genuine errors remain Error. The relay excludes the signature from chatter demotion but sends it through generic native Error/Fatal mapping. Remote telemetry collects Warning and above. A capture-evidence holder retains another signature and its observation time for a later summary; immediate relay rows discard original native severity. Historical rows contain mapped Warnings only, with unresolved provider cause and native levels.

Expected research: a factual logging section traces external observations, internal control/retained evidence and derived views, immediate versus held data, observation ages/resets, companion fields, classification branch order and remote visibility. The policy-to-output table exposes the conditional mismatch across admitted native levels. The account does not diagnose the incident or prescribe a remedy. Expected independent review: identify the owned severity-policy defect, select signature-specific classification before native fallback, and propose exactly-one-Warning checks across native levels with chatter and unrelated-error controls. Do not claim the historical Warnings were misclassified or that diagnostics restore connectivity.

## Logging sibling, near negative and known good

Use a non-transport upload fixture. Policy makes a known remote quota rejection Warning regardless of native severity. A queued diagnostic carries only severity; after retry, emission reads the current request, phase and latest provider observation. An episode suppression flag is never cleared on successful recovery. The sink uploads Warning/Error; private identity is separate from safe provider text.

Expected: the report supplies enough evidence for blind reviewers to catch severity precedence, mixed replacement state and suppressed recurrence as distinct mechanisms. Review selects scoped remedies and checks a delayed drain after a new request, plus failure → recovery → failure. Changing only log verbosity cannot repair lost identity. Do not ask to export private identity.

Pair it with a correct implementation that snapshots the original failed request/phase/observation, handles the quota signature before native fallback and clears suppression on recovery. Supply the standalone fixture's governing policy and provider guarantee that heartbeat and quota signatures are mutually exclusive. Unrelated native errors and owned invariant violations stay Error; heartbeat chatter stays local. Expect no invented logging defect on that path, no blanket demotion, no requirement to repair the provider or log every field. A research-only run stops after its factual account; missing provider cause stays a limit. Preserve these results separately from the failing sibling's findings.

Vary the recovery boundary: a service-wide diagnostic suppression flag clears on a successful native write, but that observation is inside a current-request generation fence. A replaced request's still-live provider operation can finish successfully. Expected research follows the reset through the actual callback gate and records which successes reach it; naming the reset helper is insufficient. Review should identify suppressed recurrence after that recovery and preserve the separate fence on obsolete request continuation. A correctly separated global observation and fenced continuation is the no-concern control.

## Outcome coverage beyond the visible log

Prompt: research and review logging for a server-backed service, including setup, request admission/result delivery and retained health summaries. Supply no incident diagnosis. A previous relay-only account is evidence of its bounded scope, not proof these outcome producers are sound.

Fixture: required startup data is silently skipped when empty and only warns on parse failure; valid shape with missing fields has a separate construction Error. Two admission predicates share one generic detail despite a correct retry class; native completion queues a result while the pending predicate persists until drain. A bounded health episode starts with scheduling gaps and gains complete subject measurements later, but records those measurements only on opening. The required sink receives one existing recovery/segment summary, with privacy and cardinality contracts supplied.

Expected: the coverage map includes silent setup and producer decisions before relay/result emission. Tables preserve predicate precedence, logical pending versus native progress, cause translation, episode start versus sample availability/time and full/partial sample retention. Blind review catches setup severity/absence, collapsed refusal reasons and late evidence discarded during aggregation. Remedy directions preserve activation, retry class, bounded history and one-summary reporting; they do not infer the provider cause or add a per-window stream.

An unseen sibling uses another service and measurement type. Its correct control classifies missing/invalid startup input once, leaves construction failures to their owner, preserves admission reasons, and enriches the first complete later sample with its own observation time. Expect no invented defect or private data export. An explicitly admission-only research request names setup/aggregation as excluded and stops before review; the coverage map must honor that boundary rather than expand it.
