# Trial, 2026-10-09: first version of feature-shaping

Workload: the origin case (issue 205, patch memory admission) and the paraphrased positive (recent worlds list) from `../../cases.md`. Fresh contexts. Claude Opus 5.5 through a subagent; GPT 6.1 Sol through `codex exec -m gpt-6.1-sol -s read-only`. The Codex sandbox had no network, so the five issues were exported as JSON and their path given in the prompt; the Opus run had both `gh` and the export.

## Patch memory admission

| Check | Opus 5.5 | GPT 6.1 Sol |
| --- | --- | --- |
| Idea chain with evidence and controls | 6 rows, rulings and design choices marked | 7 rows, marked |
| Ladder, crash first, assumed marks | Yes, 7 rungs, stutter before crash per Microsoft budget docs | Yes, 5 rungs |
| Distance as proxy, frame-rate claim checked | Found 104's measurement (39.2 to 38.0 ms at a tenth of the actors) and sent the question to the user | Asserted distance protects frame rate from issue text |
| Byte cap as proxy for device budget, with divergence cases | Yes: other apps shrink the Windows budget, integrated GPUs, 80% of 8 GB above the 5.3 GiB Mac recommendation | Yes: 8 GiB card with a 5 GiB budget example |
| Existing sampler found and classified direct | `PerformanceClientStatRuntime.cpp:320-385` | Same, plus engine snapshot and DXGI contract |
| Overturned ruling sent to the user | Three rulings listed | Pre-allocation and nearby admission listed |
| Settings cost | Memory is a machine fact, no setting; View Distance kept pending the frame-rate decision | Same, View Distance earns a preference |
| Smaller slice | Guard alone first | Safety boundary alone first |
| Read-only | Yes | Yes |
| Words | 4,709 | 3,292 |

Scored against cases.md as it stood on 2026-10-09 morning (rubric v1), which expected distance kept as a frame-rate control. Under that rubric both pass on content; both open with the idea chain and reach the verdict in fourth place. Under the current rubric (v3), which requires the frame-rate claim to be checked against issue 104's measurement, Sol's run fails that item: it asserted the claim from issue text. Sol read engine source extensively (texture and mesh resource-size accounting, D3D12 out-of-memory path); the reading answered Measurement rows, so it was within the step 3 allowance, but the trace was 530 KB.

## Recent worlds, Opus 5.5, version 1

Followed every section. Found recency as a proxy for return intent with the right divergence cases, applied the settings rule correctly (a streamer and a non-streamer on one PC differ), included do nothing. Misses: 2,876 words for a one-line idea; the ladder's top rungs (history exposed to an audience, crash rejoin) were needs the idea never served, and the reshaped design grew rejoin cards, a history page, server storage and telemetry around them; constants (60 s dwell, 90 days) presented as design.

## Changes made after these runs

- Depth rule at the top: a one-row chain gets a one-page report; code reading is for measurement questions and cited evidence.
- Evidence column: a measurement, crash or user report with source; otherwise *claimed*.
- Adjacent rungs: reached past the chain's own problem, one line under Decisions, out of the design.
- Placeholders for constants chosen without evidence.
- Report order: outcome, verdict, proposal, decisions, then the tables; prose budget in the first four.

## Rerun after the changes: recent worlds

| Check | Opus 5.5 v2 | GPT 6.1 Sol v2 |
| --- | --- | --- |
| Findings first, tables after | Yes | Yes |
| Words | 1,820 | 941 |
| Rejoin treated as adjacent, out of the design | Yes, Decision 5 | Yes, under Decisions |
| Constants marked as placeholders with the measurement that sets them | Yes, with a "how to set" list | Kept the user's five, measurement proposed |
| Problem marked *claimed*, "build it at all" raised | Yes | Yes |
| Alternatives | Original, do nothing, reshaped, one-tile slice; no frequency ranking | Same four; no frequency ranking |
| Scope | Reshaped design still adds "See all", account storage and an availability check, each tied to an in-scope rung | Stays at the list, adds entry rules |

Scored against cases.md rubric v2 (after the first fixes), which rejected a reshaped design with history pages or server storage and a report over about 1,200 words. Sol passes. Opus v2 fails on both counts: 1,820 words, and a design with "See all", account storage and an availability check. The earlier version of this record called it a pass with "remaining softness"; that was wrong. Neither run offered frequency or pin ranking as an alternative to recency. The failure class (the skill pulls agents to reshape around every failing row) was confirmed by the dry-run case below and fixed there.

Skill versions before the dry-run case were not hashed, so these runs cannot be tied to an exact `SKILL.md`. From the dry-run case on, each run records the SHA-256 of the installed `SKILL.md`.

## Review round

Two reviews after the reruns: the author's own pass and a cold review by a fresh Opus 5.5 context given only the skill files and the skill-authoring checklist. A third agent mapped each defect to the skill-authoring rule that covers it.

Defects found and the fix applied:

- Examples carried the development cases into every domain (the "far patch" ranking example, the recents-list adjacency example, "content density, world size, machine size", "sampler", "two users on the same machine"). Replaced with domain-neutral wording. The adjacent rung is now defined by a test (the proposal would not change whether a user meets it) instead of the incident.
- The depth rule promised a one-page report while the report section demanded eight sections and four tables. Sections 1 to 4 now have word bounds (400 for a one-row chain, 800 otherwise) and a one-row table is stated in the Verdict.
- A reshaped design was always required although only failing rows may change the design. It is now drafted only when a row fails the original.
- Contention was unconditional. It now applies only to options that use a shared resource.
- "Proxy" named both a control and a measurement class. The class is now "estimated".
- Unverified facts were routed into Decisions for the user. They are now marked where used; Decisions holds choices only.
- Code-reading limits were stated three ways. One rule remains, in step 1.
- Rules duplicated between `SKILL.md` and `GOAL.md` (settings, recommend-only, keep what works, outcome definition, sampler search). `GOAL.md` keeps reasons; `SKILL.md` keeps rules.
- The near-negative case tested nothing for a user-invoked skill. Replaced with a boundary case ("and implement it"), a keep-as-is case in a different domain (a deploy CLI dry-run flag) and a second-domain small case kept out of the skill's own examples.

Of these, only the `GOAL.md` duplication was a plain author error under skill-authoring's existing text. The rest were gaps: no applicability clause for output slots, no rule on output order or length, criteria that bound only the early stop, no empty-result branch check, and new-skill testing that covered invocation only. Those rules were added to skill-authoring's body and review checklist in the same change, with a cold-review step.

The word criteria in `cases.md` changed in this round, so the v1 and v2 recent-worlds scores above were taken against the earlier criteria. The dry-run case below is the first run against the revised skill.

## Dry-run CLI case, revised skill

| Check | GPT 6.1 Sol | Opus 5.5 v1 |
| --- | --- | --- |
| Sections 1 to 4 words (bound 400) | 373 | 741 |
| Ladder: unwanted change, false confidence, noisy preview | Yes | Yes, plus a leaked-secret rung the flag itself introduces |
| Divergence: drift between preview and apply, hidden hooks | Yes | Yes |
| Recovery, rollback, audit as adjacent | Yes | Yes |
| Design stays at the flag | Yes: read-only guarantee, unknown markers, nonzero status on incomplete preview | No: mandatory preview on every deploy, confirmation prompt for destructive changes, `--yes`, saved plans |

Sol passes. Opus fails on length and on scope. The scope pull was a scenario row where the operator skips the dry run during a hotfix: the row fails the original, so "change only what fails a scenario row" licensed a confirmation gate. Fix: a scenario in which the person does not use the proposal at all is not a failure of the proposal; the need it exposes is adjacent. The length bound now names the condition precisely (no predecessor designs) instead of "one-row chain", which this two-row chain did not match. Opus rerun recorded below.

Skill versions for this case: the Sol run and the Opus v1 run used the revision before the unused-proposal rule and the sharpened length bound, not hashed. The Opus rerun uses `SKILL.md` with SHA-256 prefix `6573d86a5238ff4b`.

Opus rerun (`6573d86a5238ff4b`): sections 1 to 4 at 429 words against the 400 bound; the design stays at the flag, with the skipped-preview case sent to the user as outside what the flag can fix and no confirmation gate; plan binding offered as an option tied to the drift row, not imposed. Pass on scope, marginal on length. Report: `dry-run.opus-5.5.v2.md`.

## Edits after the last run, untested

A later review (received from the user) found three further defects, fixed in `SKILL.md` SHA-256 prefix `bce92b853b5a2758` with no fresh run yet:

- Constraints are now classified by commitment (ruling or proposal), not by author, so a user's tentative "maybe five" is a proposal.
- Each control carries two fields, what it stands for and how the real quantity is measured, because a control can be measured directly and still be a proxy.
- One code-reading rule: read code only to answer a named factual question the proposal needs.

Next run of any case should use this hash and check that the Measurement table shows both fields.

## Origin case rerun, `SKILL.md` SHA-256 prefix `bce92b853b5a2758`, rubric v3

Input: the exported 2026-10-08 body of issue 205 and its linked issues; the live issue had been rewritten by then.

| Check | Opus 5.5 | GPT 6.1 Sol |
| --- | --- | --- |
| Sections 1 to 4 words (bound 800) | 800 | 726 |
| Frame-rate claim checked against 104's 39.2 to 38.0 ms measurement | Yes, named Lumen skew, sent View Distance meaning to the user | Yes, measurement in the idea chain, View Distance removal "needs evidence", sent to the user |
| Byte cap as proxy for the OS budget, with divergence cases | Yes: other apps, avatars, browsers, integrated GPUs, 8 GB Mac above the recommendation | Yes: baseline, pending work, other consumers; 80% unsupported |
| Existing sampler found, classified direct | Yes, `PerformanceClientStatRuntime.cpp` | Yes, plus engine cached getter and DXGI/Metal contracts |
| Two measurement fields (stands for, measured) | Yes | Yes |
| Overturned 2026-10-08 rulings sent to the user | Yes, Decision 1 | Yes, first decision |
| No player memory setting; 80% as placeholder | Yes | Yes |
| Smaller slice | Yes | Yes, safety slice first |
| Widenings flagged rather than imposed | Texture-creation degradation check flagged as needing go-ahead | Pre-allocation reservation recommended, with the overturned ruling named |
| Verdict before tables | Yes | Yes |

Both pass. Both still reach toward issue 83's reservation or degradation work; both flag it as the user's decision, which the rubric accepts. Sol's idea chain has nine rows, two of them (travel prediction, interaction residency) from project docs rather than the five issues; evidenced, so not scored as a miss.
