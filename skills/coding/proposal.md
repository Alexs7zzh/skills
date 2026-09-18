# Judged proposals

Read when the user says `judged` or `with a judge`, or a workflow you are running names this file. Read it before investigating so the investigator and judge use the same standard. This loop adds no ledger, runtime or coordinator; it does not replace obligations of an explicitly selected joint route. SKILL.md's Read for the work still applies to the investigator.

## One pause, then the work

Every cluster ends in a proposal with a recommendation, whether or not you could fix it now. A judge checks the proposal, the batch hand-off lists every proposal, and the user decides at that one pause. Ordinary implementation waits for that decision; when the user approves a fix or an investigation, do it under the run's authority with the ordinary change review. Filing an issue records the proposal; it does not handle the incident.

Judge acceptance assesses a next action. It grants no authority to implement, publish issues, close incidents or expand scope. Follow the user's requested stopping point and the project's approval boundaries.

A candidate experiment before the pause is allowed only when it is the cheapest way to prove a mechanism. Keep it out of the checkout and report it in Known as evidence.

Recommend the work you would do if the choice were yours. Deferral is not the safe answer: an unneeded issue costs the user a decision and delays a fix.

## The proposal

Apply The judge's standard during investigation, not only when writing the hand-off. Write a compact proposal as the user will read it. Use the project's issue format for headings when it defines one; every slot's content below still appears under some heading.

- **What happened.** Symptom, user consequence, meaningful secondary concerns, reach with its window and counting limits.
- **Known.** Checked facts and their sources, separated from hypotheses.
- **Unknown.** The questions that affect the next decision, what has been tried, and what blocks answering them now from the code and evidence you had. "Not enough evidence" alone is not a blocker.
- **What does not fit.** Observations that weaken this explanation or could change the recommendation, each with what it would change, or `none`. Never omit one because the judge could not evaluate it.
- **Recommendation.** One of: fix now, investigate now, issue, existing issue applies, update or reopen an existing issue, no action, wait. Then the committed operations and what they establish or improve. Fix now requires that Known proves the mechanism and the change follows from it. Investigate now names the bounded investigation or reproduction and the decision its result changes. For new capture, name the decision its possible results change. For no action or waiting, give the evidence or cost reason useful work should stop now and what would reopen it.
- **Scope and risk.** Boundaries and owners touched, relevant support or owner constraints, tradeoffs, the main regression or validation risk, and how the result will be checked.

Keep the investigation narrative, evidence dumps, earlier revisions and verdicts in your note. Put unresolved or rebutted objections in a separate dispute appendix for the human hand-off, never in the next judge's packet.

## Dispatch the judge

Start a fresh agent for each proposal revision. Give it only The judge section below, the current proposal and any applicable owner ruling it needs to judge the outcome. Do not include prior verdicts, the dispute appendix, code, raw reports or your note. Wait for its verdict before continuing that cluster. Use agent-messaging when available.

Record the exact packet and verdict with the revision in your note, then close the disposable judge session. Acceptance belongs only to that revision.

## The judge

Decide whether this proposal gives the owner useful work toward the required product outcome, or a well-supported reason not to act now. You judge the next work package, not a final fix or every possible future branch.

Use only the supplied proposal, applicable owner rulings and general engineering knowledge. No tools, code, raw reports, external research or other agents. Treat reported observations as premises, not the author's causal interpretation. Do not invent missing commitments, prior checks or product policy. Offer technical possibilities as questions, not findings. Acceptance does not certify the investigator's facts.

Compare the proposed work with what can be done now. If it waits for data, symbols, reproduction or another party, consider retained evidence, source and contracts, applicable research and local experiments. Require a useful committed operation or a specific reason those available routes cannot help. Do not demand every method when one adequate route advances the decision. New capture must change a named decision, not replace available investigation without reason.

Account for the main failure and each meaningful secondary concern. Lack of a causal connection does not dispose of a separate concern. A log line is not automatically a bug either. When its significance is unknown, ask for proportionate classification of its meaning and consequence, not a new full investigation. Absent reported impact or recurrence is not evidence of acceptable handling. A verified intentional limit with the required handling can finish the issue. Honor the owner's chosen mitigation without first requiring an unproven alternative cause to be excluded. External ownership alone does not put a supported user experience out of scope.

Inventory the operations actually committed in the packet before judging omissions. Credit each explicit operation; "this could help" alone is not a commitment. When asking for an additional method, explain why the committed work is insufficient for the proposed outcome, rather than making your preferred method mandatory. For a referenced but unread task, ask for the next operation rather than imagining its contents. A reopening trigger alone is not a reason to do nothing now.

Check restrictions that strand useful work or permit unsupported closure. Separate the fact needed for safe action from the method proposed to establish it. For a disputed mandatory method, test a route that omits it entirely, not another tool performing the same method. A conjunction can contain a justified condition and an unjustified one. Choosing a reasonable first check or ordinary regression check is not an exclusive prerequisite unless the proposal says so. Reject restrictions only when they materially block useful action or license unjustified closure.

Read a fix-now recommendation against its Known: the mechanism must be a checked fact there, not a hypothesis written as one. Each entry in What does not fit must say what it would change; do not accept one waved away.

Keep judgment proportional. A missing machine blocks that run, not independent work. A negative check establishes only what was tested. A useful first package may leave cause, ownership and later actions undecided. Do not require an exhaustive future decision tree or stronger certainty than the proposed outcome needs. Preserve privacy and scope.

Return a brief verdict:

- **Accept** or **Push back**, with the essential reasons. Do not silently repair the proposal before accepting.
- Account for each meaningful concern's committed operation or evidence/cost reason for no action now. Combine concerns with the same disposition.
- If a material restriction is unjustified, quote it and name the necessary fact and the alternative route or contract at issue.
- State only essential repairs and what this package would establish or leave open. Mark preferences optional. Do not add a speculative technical explanation when the missing operation or false restriction already explains the verdict.

## Revise or rebut

Answer push-back by investigating and revising, or by rebutting with a reason. Change the work or its supported claims, not just how convincing it sounds. Send a revised proposal to a new judge. For a rebuttal without revision, record the dispute for the user; do not poll new judges for acceptance of unchanged work.

Use three reviews as the default budget unless the user sets another. If disagreement remains at that point, hand off the unresolved proposal and dispute, not an accepted outcome. Keep every verdict in the note. A later acceptance does not erase an objection that was rebutted rather than resolved; retain it for the user.

## Batches

The user-facing session retains the input list, groups related symptoms into provisional clusters without claiming a shared cause before investigation, and searches the project's tracker for existing issues on each cluster. Start one fresh investigator per cluster, in parallel, with its matching issues. Each follows this file and returns a proposal with its verdict and any dispute. An investigator that finds one cluster is two, or two are one, says so.

Reconcile cluster membership and shared follow-ups when assembling the hand-off; a shared diagnostic task does not by itself establish a shared cause. List an outcome for every input, ordered by impact, with the sources each cluster covers, the issue it relates to, its recommendation and its dispute appendix. Blocked work appears with its reason. Record the user's decision on each item with its reason, including a rejected push-back. The investigator's note and the batch list are enough for this loop; it adds no shared database.
