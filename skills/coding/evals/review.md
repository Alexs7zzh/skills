# Selection-based review checks

Use when changing review.md, the selection table in good-code.md, or their checker.
This file is the **coordinator-only oracle**. Do not give it, the setup script, or
other trial outputs to workload agents. The staged packets contain real source,
contracts, revision digests, requests and provisional worker notes, with no answer key.

These cases reconstruct a reported failure class: a delegated review inferred a
broken user outcome from a terminal internal state even though a source fallback
preserved that outcome. The session audit established that the coding skill loaded;
the full project and private session transcripts are not bundled here. R1 is a
bounded reconstruction, not an exact historical replay. Keep the original audit
references with the trial results rather than exposing them to workload agents.

## Run a case

Run [review/setup.py](review/setup.py) from this repository with Python 3. The
helper's `--help` describes its inputs. It refuses to overwrite a trial directory
and requires the candidate review checker to exist. It launches no model or service.

```sh
python3 skills/coding/evals/review/setup.py R1 /tmp/review-r1-codex \
  --skill-dir /path/to/candidate/coding
```

1. Stage R1 through R5 in separate directories for each model. Use the same frozen
   candidate skill version for Codex and Claude; the manifest records the copied
   files' digests. Keep the expected outcomes below outside their contexts.
2. Start a fresh context at each trial directory using the existing approved
   launcher. Supply only that directory's prompt.md. The staged trial.md carries
   the skill behavior under test, permitted side effects and automatic stop condition.
   Use the supervisor deadline stated in trial.md and preserve the transcript.
   Do not manually coach a running case toward the oracle.
3. In R1 and R3, the main agent receives a provisional worker handoff. The fresh
   verifier's first packet must exclude that note and all assessment records.
   The original request, target, baseline, contract, trial brief and candidate
   guidance remain available. Record the verifier's first response before it gets
   the main agent's answers. If the runtime cannot supply an independent context,
   score fresh verification as unavailable, not passed.
4. At the first meaningful workflow failure, interrupt the trial's workers and
   inspect owned processes. Preserve source, notes, prompts and outputs. Confirm
   workers and owned jobs have stopped before repairing instructions or changing
   inputs. Do not finish the workload first. A hypothesis refuted during the review
   is expected engineering work, not this stop condition.
5. Score the actual prompts, reads, tool results, records and final answer. Save the
   first decisive failure or the evidence for success, the candidate digests, model
   identity and settings, and which skill resources loaded. Do not infer independent
   selection or completed checks from the final report alone.

The helper copies top-level skill guidance and the review checker, excluding evals
and their answer keys. These trials do not exercise deep, joint, proposal, C++ or
Unreal routes. Probes may use Python's standard library and the staged source;
no external prerequisite is needed. Source arguments
can settle a case without execution. A claimed runtime observation needs its own
returned result; the synthetic worker notes are not execution receipts.
Before scoring completion, compare the source-tree file inventory too; unchanged
manifest bytes alone do not detect added files such as Python bytecode.

## Focused verifier comparison

Use [review/verifier/README.md](review/verifier/README.md) to compare ordinary
verification, explicit challenge, and a blind source-first pass on four frozen
cases. This holds selection and investigation fixed and separately scores a true
finding, a false finding, a missed defect, a clean control, and one omitted
individual question. Its helper stages packets without the coordinator oracle and
withholds blind assessments until a retained first-pass answer is supplied.
The initial comparison uses the same pre-question-change guidance for every style;
retain the guidance version and hashes with results. It does not validate later
checker changes or replace the complete R1–R5 workflow checks below.

Retained first-pass observations are a separate experiment. Run the same frozen
cases with and without the sentence in review.md that asks the verifier to return
defects noticed while selecting, and score separately: defects the author's
assessment missed that the observations caught, false observations, and the
verifier's added token and elapsed cost. Attribute any change to that sentence
alone; do not combine it with structure-note or test-expectation changes.

## Focused wording and handoff checks

Use these cases when changing the selection table or the blind packet instructions.
Give each case to a fresh context on each evaluated model, with the same frozen
candidate guidance. Supply the situation and assigned stage without the expected
response. Require the blind-packet reader to read review.md and checker help, and
the boundary and cost/design readers to read good-code.md and good-change.md.
Let SKILL.md route the mechanical case. These check instruction interpretation; they do not establish source
truth, runtime behavior or a completed review. Retain actual reads and answers.

| Case | Situation and assigned stage | Expected response |
|---|---|---|
| Original: blind packet | Prepare a verifier's first packet for cancellation and replacement changes. The assessment has exact request, input, target and baseline metadata. Its two input labels differ from the source filenames and have a fixed order. Selections, questions, answers and a candidate finding also exist. | Copy the context fields exactly, including input labels and order. Send the original request, rulings, source access and guidance. Withhold the investigator's selections, question inventory, answers and findings. Obtain and validate the independent selection before sending the assessment. |
| Sibling: boundary evidence | Plan checks for an adapter where a provider returns zero for both empty and failed reads, timestamp units come from an old comment, and an overridden library setting is merely documented. Actual payloads and logs are available but unread; the project need and supported provider usage are unestablished. | Inspect the provider's outcome distinction, actual delivered values, the override's project obligation and provider-supported use. Do not call any unread evidence checked or declare the path clean. |
| Near negative: fixed caption | Decide the route for changing the literal caption `Review complete...` to `Review complete.` No behavior, provider or configuration is involved. | Use the normal mechanical path and a direct edit/diff check. The caption does not select review.md, boundary investigation or fresh verification. |
| Known-good: bounded planning | Plan a review of a callback that adds a config key and modes without new fields or flags. Its full-scan branch visits voice pairings up to 256 voices, but the benchmark measured only idle work. Removal, derivation, reuse, relocation and retention are proposed alternatives without a decided winner. | Include design and cost checks. Cost worst-case realtime work against the callback budget; retain the idle benchmark's limited claim. Compare applicable alternatives against obligations and costs without adopting incompatible choices or inventing a defect. |

## Scoped re-verification checks

Use [review/reverification/setup.py](review/reverification/setup.py) for changes to
prior-verdict updates or answer provenance.
Stage each case in a fresh directory for each model, using one frozen candidate
snapshot after checker and prose changes are complete. The helper launches nothing
and excludes this oracle and other eval source from workload packets.

The checked-in fixture manifest binds `records.py`, source and contracts. Staging
rejects changed, missing or added fixture files. Each packet's manifest records
that fixture-manifest digest alongside its own file hashes. After intentional
fixture changes, review the oracle below before updating the fixture hashes.

Run the deterministic staging checks with:

```sh
python3 -B skills/coding/evals/review/reverification/test_setup.py
```

They check the reopened IDs against this oracle, exact reuse of unaffected rows,
fixture drift, packet isolation and prompts staged from an unrelated directory.

```sh
python3 -B skills/coding/evals/review/reverification/setup.py R6 /tmp/reverify-r6 \
  --skill-dir /path/to/frozen/coding --guidance-version candidate-version \
  --verifier-actor run-r6-verifier
```

R6–R8 are verifier continuation stages. Their prior selection, assessments and
verification are explicitly **synthetic fixtures**, not evidence of an earlier
live reader, blind pass or runtime check. The assigned verifier role permits this
bounded same-reader simulation; it differs from the assembler and every answer
actor. Preserve those origins and the supplied input records. These cases do not
establish live multi-agent independence or replace the R1–R5 workflow checks.

Supply only the staged prompt.md. The workload must actually invoke the candidate
checker's `template verification` with `--prior` and `--prior-assessment`, consume
its returned template, settle affected verdicts from source, validate and complete
the current record. A plan to use the command does not pass. Inspect the initial
template output and final record separately: reuse must retain only applicable
prior work, and a new digest alone is not fresh evidence. Keep the coordinator's
expected outcomes and helper preflight outputs outside workload packets.

| Case | Input revision | Decisive expected behavior |
|---|---|---|
| R6: corrected evidence | `chunk_ranges` is unchanged. Q-bounds keeps its clear answer but corrects an erroneous `(8, 12)` source example to `(8, 10)` for total 10 and width 4. | Reopen Q-bounds and its outcome/boundary/evidence verdicts, inspect `min(start + width, total)`, then support the corrected source argument. Retain Q-coverage, Q-cost and unaffected category verdicts. Do not call either example an executed test. |
| R7: linked changes | The rate lookup still ignores service. F1 gains a concrete impact scenario behind an unchanged Q-service answer. Q-zone's question wording changes and Q-zero is added. Answers retain two synthetic investigator actors through the assembled assessment. | Reopen F1, Q-service, Q-zone, Q-zero and their outcome/boundary/evidence verdicts. Support F1: EU/ground 500 precedes EU/express 900, so requesting express returns 500 and underquotes by 400. Exact zone matching and numeric zero preservation are clean. Retain Q-cost and Q-inputs. Preserve existing question IDs and answer actors; the verifier must differ from both investigators and the assembler. |
| R8: unchanged-work near negative | The current assessment changes JSON indentation only. Parsed fields, source, context, actors, selection and evidence are unchanged. | Retain every prior verdict row exactly while binding the current assessment hash. The template is already complete; do not invent changed facts, fresh inspection claims, another review phase or new work merely because bytes differ. |

To check the boundary with ordinary coding, use the separately staged
[normal-runtime sibling in levels.md](levels.md#runnable-normal-runtime-sibling).
No full R1–R5 rerun is needed to score these scoped changes.

### Source revision and dependency checks

Use fresh contexts with the candidate guidance for these continuation cases. Supply
the situation and prior source/verification identities, withholding this oracle.
Retain the verifier's revised selection before sending the revised assessment.
These focused checks establish instruction interpretation; R6–R8 exercise actual
record updates and completion. Neither establishes faster wall-clock performance.

| Case | Situation | Expected response |
|---|---|---|
| Original: completion correction | A reviewed save path now returns false when closing fails. The caller is unchanged and publishes only after a true result. A separately reviewed caption is unchanged. The target digest changes; the request and baseline do not. | Continue with the existing verifier. Independently select from the correction and caller before receiving revised answers. Recheck close failure and the caller's publication decision; retain the caption's applicable evidence. Bind a fresh template to the current source and selection without editing old hashes or claiming old execution as new. |
| Sibling: unchanged dependent answer | A producer changes a queued delay from seconds to milliseconds. The unchanged scheduler still interprets seconds. Its previously verified answer and source bytes are unchanged. A separate formatting path has no dependency on the delay. | Reopen the producer/scheduler interaction and its applicability even though the consumer and answer text are unchanged. Inspect the unit contract and identify the resulting delay error. Retain unrelated formatting evidence; do not use diff-only coverage or a refreshed digest as support. |
| Selection revision: fixed context fields | A newly supplied contract changes a selection basis while request, input labels, target and baseline strings stay fixed. The verifier's revised selection bytes differ from its prior selection. | Use a fresh template bound to the revised selection. The prior-record command requires identical independent-selection bytes as well as unchanged context and identities. Retain applicable source arguments, but do not rewrite the prior verification's selection hash to make reuse pass. |
| Near negative: record formatting | Only JSON indentation changes in the assessment; parsed records, source, contracts, rulings and evidence are unchanged. | Use the prior-record template and retain every verdict exactly, bound to the current assessment bytes. No new selection, source investigation, reviewer or execution claim. R8 exercises this case. |
| Known-good: broader user request | The user changes a single save-path review into a review of every publisher, including cancellation, and changes the comparison baseline. | Run full independent selection for the new scope and baseline, then account for every new obligation. Reuse prior evidence only after checking its applicability; a bounded correction review cannot stand in for the expanded request. |

## Shared scoring

R1–R4 must preserve the requested input and baseline, apply all matching selection
rules, and support clean answers as well as findings. Additional selected rules are
acceptable when their basis names a real affected path. Exclusions need a concrete
basis; a large selection table alone proves no coverage.
The verifier must reconcile final applicability with the assessment. An answer
under another ID permits evidence reuse, not a false no/excluded classification.

The fresh verifier selects from the original input before receiving the assessment.
It checks actual source and returned evidence, and any required follow-up reaches a
verdict for the revised assessment. The checker validates records and completion;
a passing schema is not evidence of source truth or context independence. Do not
require a minimum finding count, fixed number of investigators, or a second clean pass.

For each case record `pass`, `fail`, or `not-run`, with the deciding transcript or
source location. Record a runtime capability limit separately; a truthful partial
review is preferable to a false completion but does not pass the full workflow.

## R1: delegated terminal-state finding

**Input:** a catalog panel diff and a provisional worker finding. The finding says
the entry becomes permanently blank and disabled after artwork retrieval fails.
The worker cites the exception branch assigning `artwork-failed` and returning.

**Expected:** inspect Panel.view before adopting the claimed consequence. Only
`loading` disables the entry. Every other phase supplies `artwork or BUILTIN_TILE`
and enables it. The target's exception path therefore preserves the title, built-in
cover and action just as the baseline does. Remove F1; do not keep a lower-severity
"terminal state" defect or invent a retry requirement. A source argument naming
the exception branch and view consumer is enough. The remaining applicable rows
still need supported answers and fresh verification.

**Decisive failure:** forwarding F1 without checking the consumer, preserving the
refuted consequence under weaker wording, or declaring the entire review complete
merely because the finding was rejected. A false candidate in the supplied note is
not itself a trial failure; the coordinator's treatment of it is under test.

**Fixture check:** invoke Panel.refresh with a provider raising ArtworkUnavailable.
Both versions render `{"title": "Book", "image": "builtin:cover", "enabled": True}`.
The target's internal phase is `artwork-failed`, which alone proves no user loss.

## R2: producer and consumer dependency

**Input:** producer and dashboard changes. The queue scheduler is unchanged.

**Expected:** include the shared queue contract under boundary and integration,
and trace publish_after into schedule despite the scheduler having no diff.
The producer changes seconds into a value 1,000 times larger without changing the
consumer's interpretation. At time 10, a two-second delay produces due time 2010
instead of 12. Report that supported delayed-delivery defect and its mechanism.
The dashboard's singular/plural correction is clean and remains in scope.
Separate local answers about these paths do not close their required interactions.

**Decisive failure:** excluding the unchanged consumer, accepting independent
"producer writes a number" and "scheduler adds the delay" answers as integration
evidence, losing the dashboard input, or proposing another inspection later despite
the deciding source and executable functions being available now.

**Fixture check:** build a queue with publish_after(queue, 2, "hello") and inspect
schedule(queue, 10). The baseline due time is 12; the target due time is 2010.
summary returns `1 pending message` for that queue in the target.

## R3: selected cancellation path left unchecked

**Input:** a new Export.cancel operation and a provisional clean worker answer.
The worker selects state, async and failure, but its claimed check only cancels
before dispatch. It also observes the separate replacement-generation guard.

**Expected:** preserve the selected cancellation question until the Jobs delivery
contract is read. Follow `start → dispatch → cancel → callback`. Jobs.cancel only
removes pending callbacks; dispatch already removed this callback. Cancel does not
invalidate Export.generation, so _finished publishes and overwrites cancelled with
ready. Report that violation of the stated cancellation contract. Distinguish it
from replacement: a later start increments generation and does reject old results.
Cancellation before dispatch also succeeds. The source walkthrough is a deciding
check; an actual local probe is available if needed.
The baseline has no cancel operation. A report may compare replacement across both
revisions, but must not claim the baseline passed a cancellation scenario that
could not run there. Check the final wording against the verified assessment too.
No status reader exists in this fixture, and the contract does not define status
semantics after cancellation from idle or after completion. Do not turn those
unproven consequences into supported improvements merely because no defect is proved.

**Decisive failure:** accepting the selected row as covered because it says clean,
treating queue removal as a guarantee for dispatched work, or counting the
replacement guard as cancellation evidence. An available late-callback check may
not become an unexecuted recommendation or a vague coverage caveat. The main agent
may discover the gap before its fresh verifier; the case does not require planting
an error in a real assessment to make the verifier find it.

**Fixture check:** retain the callback returned by Jobs.dispatch(export.job_id),
call export.cancel(), then invoke that callback. A list passed as publish via
`published.append` receives the result and status becomes ready. In a separate
instance, start a replacement before invoking the old callback; it publishes
nothing. These are distinct interleavings, not duplicate tests.

## R4: small correct review

**Input:** a singular/plural correction to a pure summary function.

**Expected:** complete the small explicit review with concrete applicability,
supported clean answers and one fresh verifier. Inputs 0, 1 and 2 meet the contract
after the change; the source argument is sufficient. There is no asynchronous or
resource lifecycle to investigate. Do not manufacture an issue, architecture work,
a test file, extra review roles or an additional clean pass. The procedure's small
records and checker still apply because this is an explicit review request.

**Decisive failure:** skipping independent verification because the change is small,
or inflating a correct formatting change into a new design or investigation task.

## R5: ordinary mechanical edit

**Input:** change the fixed caption `Review complete...` to `Review complete.`.
The word Review is inside the caption; the user requests an edit, not an assessment.

**Expected:** edit only target/caption.py, inspect the result and report it briefly.
Do not load review.md, create review selection/assessment/verification records, or
launch a reviewer. The normal mechanical path needs no design or deep records.
The baseline and candidate skill files must retain their manifest hashes.

**Decisive failure:** routing the caption's quoted word into review machinery,
changing behavior beyond the caption, or treating this ordinary edit as permission
to alter the candidate skill. R5 is the routing near negative; R4 is the known-good
explicit review, so the two should deliberately have different workflow costs.
