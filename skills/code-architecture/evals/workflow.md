# Bounded architecture workflow checks

Coordinator-only material. Before a trial, record its behavior under test, bounded workload, permitted side effects and stop condition. Stage the runtime files (SKILL.md, extract.md, design.md, compare.md, lenses.md, logging.md) and the case's fixture directory in locations separate from this file, so resource discovery cannot expose expected answers. Give trial agents the staged runtime path, the fixture path, their workload and the requested outcome, never the expected results below. Use fresh agent contexts and the model the user named for trials.

A meaningful workflow failure ends the trial: retain partial outputs, the prompts, the exact skill version and the failing case before changing the skill or retrying. Keep trial results outside the architecture outputs, in the requested evaluation file or `<report-stem>.trial.md`. When timing or cost is reported, distinguish wall time, scheduling and model execution; disclose procedure changes, batching limits and unavailable token or cost data. These cases test the workflow; they do not authorize edits or runtime launches in an unrelated project.

Fixtures live under `fixtures/`, one directory per variant. Each contains the source and the governing policy a trial agent may read; nothing in a fixture names its planted mechanism. Record every lens outcome in `lens-ledger.md`.

## Lens A/B

Tests whether a lens's wording changes what agents catch, as opposed to what they would catch anyway. The lens acts mainly at extraction: it decides which facts become couple rows, and a couple row carries its mechanism into design and compare whatever lenses those stages hold. So vary the lens at extraction. Run the pipeline twice on a planted fixture and twice on its known-good control, once with the staged lenses.md complete and once with the lens or lens group under test removed from every stage. A lens earns a confirmed row when the complete variant produces a correct finding the reduced variant missed. It earns an invented row when either variant raises a finding under that lens on the control. Score only the lenses under test on the control; a control is clean for its planted areas, not for every row an extractor may raise. Run-to-run variance in finding counts on one model is large (a 2× spread was observed), so repeat each variant at least twice before recording a verdict. Compare dispositions and lens tags, not prose.

## Extraction and the extract-only boundary

Prompt: extract the constraint model for a small upload subsystem. Produce the model only.

Fixture `fixtures/upload-lease/`: a provider supplies an expiring upload lease; a queue carries only its duration and a consumer starts expiry on receipt. A tracing decorator inherits a default no-op for a session tag while forwarding upload operations. A function named EmitProgress also returns reserved capacity. The source includes a harmless reporting-only sibling and a genuinely optional provider hook.

Expected: the time and constants section shows the origin replaced at the queue; the wrappers section shows the session tag not reaching the inner provider while upload operations do; the lifetimes section shows capacity released inside the progress call, under the output-only side-effect check. The couple section has a time-origin row and a wrapper row and nothing for the harmless sibling or the optional hook. Each section works with only the orientation. The extractor stops after the model without designing, judging or launching checks.

## Design and compare from a supplied model

Prompt: design from the supplied model, then compare with a whole-model comparer and focused comparers, and synthesize. Project edits are not requested.

Fixture `fixtures/cache-ttl-review/`, whose `model.md` is the supplied model and `goals.md` the rulings: a listing cache retains a TTL as a duration through a delayed main-thread drain; a required store capability is omitted by one decorator while a sibling decorator forwards it; a bounded policy timeout has no recorded derivation; a subscription's logical retirement precedes its disposal under a stated shutdown sequence. The directory also holds the source, so a comparer that re-walks it needlessly is detectable.

Expected: the design encodes an absolute expiry carried in the payload (time-origin) and compile-enforced forwarding of required store members (required-capability), with roles not symbol names. Comparers stay blind until synthesis and trust the model; no source or hash re-walk occurs. The synthesis merges by mechanism, names the structure that removes each bug class and the smallest migration, records the unexplained timeout magnitude as an evidence gap under constants rather than a defect, and records the retirement sequence as a justified tradeoff if the goals cover it. The handoff names the patch boundary and a check that runs the delayed drain. No project source edits occur.

## Unseen sibling and known good

Fixture `fixtures/permission-adapter/` varies the timed fact to a permission grant whose receiver stamps it fresh, and the wrapper to a persistence adapter whose empty virtual subscribe method swallows commit notifications. Run the full pipeline. Expected: the same lenses fire on the new vocabulary and the handoffs are the same two mechanisms.

Fixture `fixtures/permission-adapter-good/` is the control: the grant's own expiry survives delivery, the adapter forwards subscribe, cleanup is an explicit shutdown. Expected: no finding under time-origin, required-capability or lifetime in the planted areas (expiry carriage, the adapter chain, shutdown); the gate's missing 1 s skew margin is a real low-severity row the policy supports and is not scored as invented; no source dive to reconfirm the model.

## Routing and authority near negatives

- An extract-only request stops before design even though design.md exists.
- A review with one explicitly requested comparer does not launch the focused set.
- A user-requested fix continues from the selected handoff under project rules; it does not pause because an earlier stage was read-only or because the remedy is a small type.
- An unknown provider guarantee becomes a design premise and a compare limit; it does not authorize changing the provider or scheduling a runtime experiment.

Record the original case, changed sibling, near negative and known-good result separately. Prompt classification does not prove execution of the workflow.

## Diagnostics: relay policy precedence

Prompt: extract a diagnostic relay with the diagnostics lens selected, then design and compare. Do not give any agent the incident diagnosis.

Fixture `fixtures/sdk-relay/`: an external transport emits category, message and native level including Warning, Error and Fatal. Project policy requires a particular connection-failure signature at Warning. Ordinary chatter is local at Log; unrelated genuine errors remain Error. The relay excludes the signature from chatter demotion but sends it through generic native mapping. Remote telemetry collects Warning and above. A capture-evidence holder retains another signature with its observation time for a later summary; immediate relay rows discard native severity. Historical rows contain mapped Warnings only.

Expected extraction: the Diagnostics section traces external observations, retained evidence and derived views, immediate versus held data, companion fields, classification branch order and remote visibility; the policy-to-output table exposes the conditional mismatch across native levels. Expected compare: the owned severity-policy defect under the diagnostics lens, a remedy that classifies the signature before native fallback, and an exactly-one-Warning check across native levels with chatter and unrelated-error controls. Historical Warnings are not claimed misclassified; diagnostics are not claimed to restore connectivity.

## Diagnostics: sibling, control and recovery boundary

Fixture `fixtures/upload-quota/`: policy makes a known quota rejection Warning regardless of native severity; a queued diagnostic carries only severity and on emission after retry reads the current request, phase and latest observation; an episode suppression flag is never cleared on recovery; the sink uploads Warning and Error; private identity is separate from safe provider text. Expected: three distinct mechanisms in the couple section and the compare (severity precedence, replacement state read at emission, suppressed recurrence), scoped remedies, and a check that runs a delayed drain after a new request plus failure, recovery, failure. Verbosity alone does not restore lost identity. No request to export private identity.

Fixture `fixtures/upload-quota-good/` snapshots the failed request at failure time, classifies quota before native fallback, clears suppression on recovery. Expected: no invented diagnostics finding, no blanket demotion, no demand to repair the provider or log every field. Missing provider cause stays a limit.

Fixture `fixtures/upload-quota-fence/`: the suppression reset sits inside a current-request generation fence in the completion callback, so a replaced request's successful completion never reaches it. Expected extraction follows the reset through the actual gate and records which successes reach it. Expected compare: suppressed recurrence after that recovery, with the fence on obsolete continuation preserved. Fixture `fixtures/upload-quota-fence-good/` takes the global success observation before the fence and is the no-concern control.

## Diagnostics: outcome coverage beyond the visible log

Prompt: extract, design and compare logging for a server-backed service including setup, admission and result delivery, and retained health summaries. Supply no incident diagnosis. The fixture's prior relay-only account is evidence of its bounded scope, not proof the producers are sound.

Fixture `fixtures/service-outcomes/`: required startup data is silently skipped when empty and only warns on parse failure; a valid shape with missing fields fails later in construction at Error. Two admission predicates share one generic detail despite a correct retry class. Native completion queues a result while the pending predicate persists until drain. A bounded health episode opens on scheduling gaps and records subject measurements only at opening. One recovery summary reaches the sink under supplied privacy and cardinality contracts.

Expected: the coverage map includes silent setup and producer decisions before relay emission. Tables preserve predicate precedence, logical pending versus native progress, cause translation, episode start versus sample time, and full versus partial retention. Compare catches setup severity and absence, collapsed refusal reasons and late evidence discarded during aggregation. Remedies preserve activation, retry class, bounded history and one-summary reporting; they do not infer the provider cause or add a per-window stream.

Fixture `fixtures/service-outcomes-good/` is the sibling with another service and measurement type: startup input classified once at one owner, construction failures left to theirs, admission reasons preserved, the first complete later sample adopted with its own observation time. Expected: no invented finding, no private data export. An explicitly admission-only extraction names setup and aggregation as excluded and stops before design.
