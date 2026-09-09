# Findings

Read for candidate records, ledger investigations, user decisions, continuity and completion. Common evidence and working-note standards live in [evidence.md](./evidence.md). Terms are defined in SKILL.md.

## Change records

Separate claims from implementations so changing one does not erase the other. These are content vocabulary, not mandatory database states or one task each. Retain the records needed to explain the work:

| Content | It records |
|---|---|
| Coverage | A hunk, symptom, cluster, or scenario, and whether it is covered, open, or a named gap |
| Issue | The claim, site, trigger, user impact, evidence and certainty step, and disposition |
| Question | The consequential decision, options, recommendation, affected work, and the user's answer |
| Proposed fix | The issues or feature goal it answers, origin as a mechanism or requirement, shape, sites walked, rulings checked, validation plan, and cost |
| Shelved fix | The recoverable candidate, exact baseline, dependency candidates and revisions, and a validation record for that version |
| Check-in | The user's selection and authorization, executor, and resulting changeset or drop |

A proposed fix's validation plan may be a test, measurement, demonstration, or code proof; say what it must distinguish. Missing fields make a direction incomplete, not permission to invent values.

Write new or contested issues while investigating. Either investigator can take the next action and develop a proposed fix before the peer agrees. For report-only work, examine the proposal's sites and evidence before concluding that it is suitable. Proposal discussion never gates a candidate. Record a consequential unanswered question as an explicit user wait on affected work; the helper does not infer dependencies or authority from paragraphs.

A candidate's independent review covers the current claim, implementation, and validation together per good-change.md, Review the result. Keep supported issue conclusions when a patch needs revision; do not turn disagreement about a shape into a new dispute about an unchanged fact.

## Conclusions and replacement

In a joint run, both investigators agree on substantive conclusions, not each intermediate hypothesis or experiment. Either can publish the conclusion and its reasons: fixed, not a defect, intentionally unchanged, impossible, or another explicit outcome. Publication endorses the author's current argument; the peer checks it before agreeing. An evidence upload, observation, or checkpoint alone is not an endorsement. A child assessment helps the judgment but cannot supply either investigator's agreement.

When one issue should continue through one or more others, record a replacement and explain in ordinary language why those issues account for the original concern. This covers duplicates, a narrower actionable subset, a broader cause, and work that splits into several investigations. Identify what is excluded, added, or still unresolved. Both investigators agree with that explanation; either may start the continuing work before agreement. Reuse an existing issue when appropriate rather than duplicating its investigation.

Replacement preserves the original issue and its explanation; it does not say that issue was fixed. When the continuing work concludes, explain what its outcomes mean for the original concern. A child concluding "impossible" does not establish a parent conclusion that required its success. The investigators judge that relationship; do not construct a formal proof for the helper or assume the helper has checked it.

## Related work

When issues combine into a new failure, common cause, or different impact, record the combined claim and its links. Verify the new claim rather than stamping the same report again. Walk interactions between overlapping candidates before treating them as independent.

Link the evidence and rulings a conclusion uses so the peer can check the same material. When related evidence or a ruling changes, identify and reopen the affected conclusions; the helper cannot infer that impact from their meaning. Use notes for exploratory relationships and replacement for a change in which issues carry the investigation forward.

Keep baseline and dependency revisions with every candidate and its evidence. Batch builds when useful, but name the combination tested. File overlap alone does not make changes inseparable; combine candidates when they depend on each other and record that reason.

## Continuity

Publishing a material revision endorses the new conclusion and clears the peer's prior agreement. Keep cosmetic edits and checkpoints in notes when they do not change the argument. Agree only with the revision actually checked; if it changed while you were reading, inspect the difference before agreeing again. Retain earlier conclusions and assessments as history, not approval of the new version. Ownership-only handoff does not change the argument or its agreement.

An assessment names the candidate, baseline, and evidence it actually checked, not newer material fetched only when saving the verdict. A changed claim, candidate, dependency, or ruling requires checking which conclusions remain supported and republishing affected ones. A change to the argument alone does not make unchanged runtime validation stale. Keep unresolved conditions visible until evidence or a ruling resolves them and the investigators accept that resolution. Finishing a child assessment means its report arrived, not that the investigators accepted it.

Validation has its own input basis: the saved candidate, baseline and dependency candidates. Refresh its record when those inputs change, including when a dependency is dropped, explaining what was rerun and what remains applicable. An inapplicable review is not a candidate revision and does not by itself require new validation content. The reviewer checks whether retained evidence supports the current claim and rulings; record a concrete condition if it does not. A filename pointing at an old green log is not fresh evidence. Retain local candidate files immutably; a remote shelve must name its exact revision rather than a moving branch.

When an observation or ruling resolves conditions without changing the candidate, ask the peer or independent reader to check that reason and the new evidence. Do not fabricate a candidate edit to request reconsideration.

Continue the same run when the task resumes, including after a session or context reset or a request to implement the reported result. When the user changes how far to go, update that setting in the existing record with its reason; the pinned helper's help supplies the command. Before handing off, retain the current candidate, baseline and dependencies, validation record, unfinished work, questions, and brief reasons for rejected alternatives. The next reader checks what changed and resumes from that material.

A separate run may inspect earlier artifacts. Reuse a conclusion only after checking that its code, inputs, environment, and relevant assumptions still apply; rerun or re-walk the changed parts. A previous report points to evidence and never substitutes for it. Do not restart discovery merely because the session is new, or freeze a conclusion merely because the run is the same.

If an older pinned helper cannot express the resumed work, create a compatible record linked to the old one and carry forward its applicable evidence, candidates, and open decisions. Preserve the original record and helper. Changing the record format does not require repeating the investigation.

## Whose call

Apply SKILL.md, Authority and judgment, before opening a question. Prefer a reviewable candidate to asking the user to choose an implementation. Missing spec detail, competing designs, and a larger fix call for investigation and judgment under the existing candidate authority, not a user wait. Record consequential assumptions and tradeoffs so the user can judge the result. Peer agreement does not accept those tradeoffs on the user's behalf.

For a choice that does need the user, show:
- the goal or ruling at stake and the concrete experience each option produces;
- what is known, how the condition arises, and any uncertainty that matters to the choice;
- feasible options with code impact, user effect, and a recommendation;
- the next action that cannot proceed without the answer, and why investigation or a recoverable candidate cannot settle it. Name any explicit restriction or external effect that needs new authority.

When new evidence challenges a ruling, identify the consequence and distinguish the current requirement from your proposed alternative. A user should not need to read code or a long spec to understand it. A consequential recommendation can be reported without blocking candidate development; use a user wait only for the action identified above. Keep that wait open until answered, preserve its candidate, and continue independent work. Record the answer and affected inputs through ledger.md, Ordinary coordination; a note alone does not resolve a user wait.

## Completion

A joint investigation is concluded when both investigators agree on the substantive outcomes and replacement explanations that account for its requested scope. An impossible or intentionally stopped outcome is a conclusion, not a successful fix. A user wait remains open until the user answers or changes the scope. Empty eligible work is not agreement or completion. Further passes need a remaining uncertainty or uncovered obligation, not a quota of repeated clean reviews.

Report meaningful outcomes while work continues: conclusions, replacements, cancellations, stops, and consequential blockers or user waits. Retain the reasons, alternatives considered and next action in the record. Master reads newly surfaced outcomes and summarizes them for the user, grouping related results rather than relaying every mutation. Acknowledging that report does not approve its engineering claim. Routine waiting on an active peer need not interrupt the user. Reporting is always possible, including when the investigators disagree; make that disagreement explicit.

Hardening and telemetry-quality findings need a disposition, not a mandatory implementation. After discovery, either investigator can propose a candidate, disprove or replace the claim, or publish an explicit disposition with the reason and next evidence or action. A deferral can conclude the promised triage outcome with peer agreement; the label alone cannot. Nits remain optional.

In fix mode, retain independently reviewed candidates until the user selects, changes, or drops them. Record a user-authorized drop of a proposed fix and its candidate with the reason, retaining its evidence and invalidating affected dependents. This is a terminal disposition, distinct from a reviewer's rejection during engineering discussion, and needs no check-in authorization. In report-only mode, retain the proposal and useful experiments for continuation. Neither mode needs a commit to finish its report.

Dropping part of a bundled candidate makes that bundle historical, not its surviving proposals abandoned. Retain the old artifact; develop and review a new candidate for the surviving work. Questions and answers do not revive a dropped proposal. A changed goal uses a new proposal.

Before checking in a selected candidate, verify its reviewed revision and dependency selection. A dependency must already be present or included in the authorized selection; otherwise explain the concrete choice. A drop or revision reopens only affected dependents. Record each authorized changeset and departure from the reviewed shape, then revalidate anything that departure changes.

Keep decisions and evidence where later work can find them: a regression test or invariant at the owning boundary, a ruling with its rationale in the feature doc, a retained measurement, or an explicit open item for unavailable evidence. Do not add comments, asserts, or tests merely to manufacture an exit for a disproved finding.
