# Findings

The shared rules for evidence, records, decisions, and completion. Read Evidence for every coding task that makes a judgment; read the remaining sections when recording or resolving work. Terms are defined in SKILL.md.

## Evidence

**Choose evidence by what the claim says.** State the claim and a plausible alternative that would make it wrong. Choose a check whose result could distinguish them, using the actual boundary, inputs, and environment the claim covers. A check that cannot distinguish them adds no support. Agreement, a test name, or repetition of the implementation is not independent evidence.

A validation record contains the claim and alternative; method and exact invocation or code/contract walk; inputs, environment, baseline, and candidate; observed result with artifact paths; and the limits or remaining uncertainty. Keep the full record on disk and its useful conclusion in the issue or report. For a code proof, retain the relevant paths, assumptions, and contracts so another reader can challenge them.

Examples of this principle, not an exhaustive set of cases:

| Claim | Evidence that can distinguish it |
|---|---|
| A defect occurs and the change removes it | A reproducer on the actual affected code before and after the change, with the inputs and both results retained |
| Behavior is preserved while structure changes | Checks of the relevant observable behavior on both versions, plus a code argument for the changed ownership or invariant; passing both times can be the expected result |
| A feature meets its goal | Acceptance scenarios derived from the user's experience and rulings, including affected failure paths; a demo when experience cannot be judged from code |
| A path meets a performance budget | Measurements on the relevant path and workload against the budget, with the target environment and scaling assumptions |
| A state cannot occur | A code or contract proof covering the ways it could arise, with evidence for its premises; a stress run without failures establishes only what was observed |

When a practical probe can settle the uncertainty, run it instead of extending the argument. Choose its inputs independently of the design's convenient constants or symmetries. A fifteen-minute probe is a useful prompt to try the experiment, not a universal limit on worthwhile investigation. Test through shipped code when the claim includes its wiring; a replica establishes only the mechanism it reproduces.

When a result surprises you, check the observation method and inputs as well as the system. Disagreeing probes may have exercised different cases. Batch independent probes under one stable build; an experiment that depends on an earlier result belongs in the next batch.

If no available check can distinguish the alternatives, narrow the claim or leave the uncertainty open, with what would resolve it and why it is unavailable. Choose another method when it can answer the question. Do not manufacture a failing test, call every missing test seam an architecture defect, or ask the user to waive an arbitrary log requirement. A testability problem is an issue when it prevents a needed assurance about the project.

The ledger's certainty steps identify the basis of a claim, not a probability or a total ordering of evidence:
1. Unsupported assertion.
2. Checked source or observed fact, with its relevance still to establish.
3. Code or contract proof of the stated claim under recorded assumptions.
4. Executed check or measurement, with its input class and artifacts.
5. Direct observation in the running target system, with its context and artifacts.

A verified issue needs a retained evidence path and a supported claim at step 3, 4, or 5. A higher number does not expand what the evidence proves. A dismissal has the same burden as the claim it makes: “by design,” “engine noise,” and “not our fault” need the applicable ruling or evidence. Engine, plugin, and vendored code remain investigation targets when they determine the outcome.

## Working record

Use the ledger by default for substantive writing, quick review, and plain diagnosis, not only for deep or multi-agent work. Start or resume the record while gathering the goal and evidence; do not wait for a confirmed issue or candidate. Local setup is in [ledger.md](./ledger.md); two-family coordination is in deep.md when that mode is needed.

Start a short current note with the goal, rulings, known scope, and first investigation. Before moving to another issue or cluster, or requesting a context reset, preserve the current conclusion or hypothesis, evidence pointers, rejected alternatives that matter, and the next action or blocker. Update the corresponding coverage and issue rows when that work has an outcome; an unresolved cause can remain a gap or hypothesis. Do not defer these records until the whole pass is finished or context is compacted. A harness-private checkpoint may supplement this record, not replace the state another investigator needs. Notes hold working state that does not yet fit a row; do not invent an issue or complete proposal merely to save it. Recording a direction does not gate developing or testing it.

Keep the note an index of current work; let rows own their recorded state, and link full logs and history instead of copying them. On resumption or a work switch, read that summary and the relevant rows and artifacts. Use a row's timeline when its history matters, rather than rereading the whole run. A note points to evidence; it does not upgrade a hypothesis, settle a user decision, or replace independent review. Record meaningful work boundaries, not every command or file read. A clean review or inconclusive investigation can have notes and coverage without manufactured findings.

## Change records

The database separates claims from implementations so changing one does not erase the other. The row names are:

| Row | It records |
|---|---|
| Coverage | A hunk, symptom, cluster, or scenario, and whether it is covered, open, or a named gap |
| Issue | The claim, site, trigger, user impact, evidence and certainty step, and disposition |
| Question | The consequential decision, options, recommendation, affected work, and the user's answer |
| Proposed fix | The issues or feature goal it answers, origin as a mechanism or requirement, shape, sites walked, rulings checked, validation plan, and cost |
| Shelved fix | The recoverable candidate, exact baseline, dependency candidates and revisions, and a validation record for that version |
| Check-in | The user's selection and authorization, executor, and resulting changeset or drop |

For an issue, investigate how the trigger arises, its scope and rough frequency where relevant; distinguish observations from estimates. For a maintenance finding, name the concrete future task or failure class affected. A proposed fix's validation plan may be a test, measurement, demonstration, or code proof; say what it must distinguish. Missing fields make a direction incomplete, not permission to invent values.

Write new or contested issues while investigating. Their author can take the work and develop a proposed fix before another reviewer agrees. For report-only work, a proposal can be independently marked after its sites and evidence are examined. Proposal discussion never gates a candidate; an open question still blocks its dependent work.

A candidate's clean independent review covers the current claim, implementation, and validation together per good-change.md, Review the result. Nobody marks a revision they wrote. Keep supported issue conclusions when a patch needs revision; do not turn disagreement about a shape into a new dispute about an unchanged fact.

## Labels and impact

- **Bug.** A defect with an investigated trigger or a supported proof that the contract is violated.
- **Restructure.** A concrete maintenance cost or failure mechanism that a structural change removes. Related bugs can be its evidence; deletion is justified by the requirement investigation in good-code.md.
- **Hardening.** A real defect with low current impact. Prefer fixing it alongside substantive work where its risk is already being exercised. It never gates a release on its own.
- **Nit.** A minor improvement with no substantive impact. Fix it in the same touch, or accept it with a reason; do not keep returning it as open work.
- **telemetry-quality.** A defect in what telemetry reports. Judge it against the logging or pipeline contract; it is not release-gating on its own.

Record impact from 1, highest, to 5, lowest. Lead with the user consequence; keep Hardening, telemetry-quality, and Nit in separate batches. A low measured impact can lower severity without proving the underlying invariant sound. Investigate numbers that lower severity as carefully as numbers that raise it.

A technical document contradicting an actual release contract is a defect; first establish that contract per SKILL.md, Authority. An unverified constant, a misleading detector, or a failed coverage claim earns an issue when its unsupported assumption affects a concrete obligation. A deliberate human choice suppresses only claims its rationale addresses. New evidence can justify challenging it through a question.

## Related work

When issues combine into a new failure, common cause, or different impact, record the combined claim and its links. Verify the new claim rather than stamping the same report again. Walk interactions between overlapping candidates before treating them as independent.

An issue's `parents` are claims its proof depends on, not merely related topics. Reassess that claim and its downstream reviews when a parent changes; retain its evidence for the new assessment. Use clusters or notes for relationships that do not imply this dependence.

Keep baseline and dependency revisions with every candidate and its evidence. Batch builds when useful, but name the combination tested. File overlap alone does not make changes inseparable; combine candidates when they depend on each other and record that reason.

## Continuity

A material edit to a checked claim, proposal, candidate, or dependency invalidates reviews that rely on it, downstream only. Use notes for additional rationale or presentation changes that leave the checked content intact. A claim or proposal edit reopens the affected review without making an unchanged candidate's validation stale. An answered question also reopens affected reviews so they account for the ruling; the answer alone does not require a candidate edit. Keep outstanding review conditions and already-stale validation until resolved.

An assessment identifies the inputs the reader received, not just the candidate revision. Before reviewing, retain the target revision, helper's review basis and supporting input references with the assessment; for a candidate review, include the saved candidate and baseline. Submit that recorded basis with the verdict, not a newly fetched token at submission time. If a claim, proposal, ruling, proof parent, or candidate dependency changed, retain the new inputs and basis and reassess the affected conclusion before submitting it. Ownership-only handoff does not change the basis. A rejected old submission requires reassessment, not a fabricated candidate edit or new validation run.

Refresh the validation record when the candidate, baseline, or dependency candidates change, including when a dependency is dropped, explaining what was rerun and what remains applicable. Clearing a review is not a candidate revision and does not by itself require new validation content. The reviewer checks whether retained evidence supports the current claim and rulings; record a concrete condition if it does not. A filename pointing at an old green log is not fresh evidence.

When an observation or ruling resolves review conditions without changing candidate inputs or invalidating its evidence, the author can request re-review with that reason. This queues the unchanged candidate for its independent reader and preserves the conditions until reviewed. An independent reader already investigating the conditions can re-review directly. Only that review clears or replaces the current conditions; their history remains in the record.

Continue the same run when the task resumes, including after a session or context reset or a request to implement the reported result. When the user changes how far to go, update that setting in the existing record with its reason; the pinned helper's help supplies the command. Before handing off, retain the current candidate, baseline and dependencies, validation record, unfinished work, questions, and brief reasons for rejected alternatives. The next reader checks what changed and resumes from that material.

A separate run may inspect earlier artifacts. Reuse a conclusion only after checking that its code, inputs, environment, and relevant assumptions still apply; rerun or re-walk the changed parts. A previous report points to evidence and never substitutes for it. Do not restart discovery merely because the session is new, or freeze a conclusion merely because the run is the same.

If an older pinned helper cannot express the resumed work, create a compatible record linked to the old one and carry forward its applicable evidence, candidates, and open decisions. Preserve the original record and helper. Changing the record format does not require repeating the investigation.

## Whose call

Apply SKILL.md, Authority and judgment, before opening a question. Missing spec detail and competing engineering options are not automatically user decisions. Choose within the known goals and rulings, record a consequential assumption, and make the result reviewable.

For a choice that does need the user, show:
- the goal or ruling at stake and the concrete experience each option produces;
- what is known, how the condition arises, and any uncertainty that matters to the choice;
- feasible options with code impact, user effect, and a recommendation;
- why the choice needs the user's judgment or authority.

When new evidence challenges a ruling, identify that evidence and the consequence; do not silently discard the ruling or suppress the evidence. A user should not need to read code or a long spec to understand the choice. Keep the question open until answered, preserve its candidate, and continue independent work.

## Completion

A run is ready to report when its scoped obligations have been checked or explicitly left open, candidates have their current review states, and remaining questions or evidence gaps say what would resolve them. Empty ready work permits a report; it does not turn unresolved work into clean work. Further passes need a remaining uncertainty or uncovered obligation, not a quota of repeated clean reviews.

Hardening and telemetry-quality findings need a disposition, not a mandatory implementation. After discovery, their author (or the seat holding the investigation) chooses a candidate, disproves or merges the claim, or records an explicit exit with the reason and next evidence or action. An explicit deferral clears this work; the label alone does not. Nits remain optional.

In fix mode, retain independently reviewed candidates until the user selects, changes, or drops them. Record a user-authorized drop of a proposed fix and its candidate with the reason, retaining its evidence and invalidating affected dependents. This is a terminal disposition, distinct from a reviewer's rejection during engineering discussion, and needs no check-in authorization. In report-only mode, retain the proposal and useful experiments for continuation. Neither mode needs a commit to finish its report.

Dropping part of a bundled candidate makes that bundle historical, not its surviving proposals abandoned. Retain the old artifact; develop and review a new candidate for the surviving work. Questions and answers do not revive a dropped proposal. A changed goal uses a new proposal.

Before checking in a selected candidate, verify its reviewed revision and dependency selection. A dependency must already be present or included in the authorized selection; otherwise explain the concrete choice. A drop or revision reopens only affected dependents. Record each authorized changeset and departure from the reviewed shape, then revalidate anything that departure changes.

Keep decisions and evidence where later work can find them: a regression test or invariant at the owning boundary, a ruling with its rationale in the feature doc, a retained measurement, or an explicit open item for unavailable evidence. Do not add comments, asserts, or tests merely to manufacture an exit for a disproved finding.
