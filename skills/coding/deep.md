# The deep run

Coordination for broad coverage and independent investigation. review.md and diagnose.md gather inputs; good-code.md, evidence.md, good-change.md and findings.md govern engineering judgment. ledger.md owns task, record, dispatch and checkout mechanics. The helper does not conduct a coding phase sequence.

## Roles

The user-facing master retains the requested input, carries user rulings, coordinates workers and summarizes their arguments and stops throughout the run. The two investigators have equal authority to discover, implement, challenge conclusions and raise questions. They pursue the same investigation, not permanent implementation/review specialties. Action assignments can differ to avoid interference; neither seat is primary. Without an available shared runtime, the user-facing agent investigates locally with bounded independent checks and states the independence actually achieved.

For a two-family run, use reviewer A on Claude Opus at high effort and reviewer B on Codex gpt-5.6-sol at high effort. Both can investigate and write through the shared checkout contract. A fresh reader is a separate execution, not a continuing reviewer changing its label.

## Work together

1. Give both investigators the same goal, rulings, baseline and available evidence. Register original questions or input clusters in the shared investigation; a clean investigation need not manufacture bugs.
2. Investigate independently before comparing the peer's conclusions. Save the independent observations in records. This is a methodological exposure boundary, not a separate database or enforced data secrecy. Reading and reasoning about the same node do not require taking its action ownership.
3. Develop candidates while their investigation is in context. Either investigator may register newly discovered issues or publish a plain-language replacement of one issue by one or more continuing issues. Explain what the replacement covers or excludes. Investigate children without waiting for a replacement stamp; action and checkout ownership still prevent conflicting writes or duplicate child execution.
4. Publish substantive conclusions with the retained argument and evidence. The author endorses the publication; the peer examines it and agrees, revises or reopens with a concrete reason. Both investigators' assent is required for final conclusions and replacement explanations, not for each experiment. A child may supply a fresh assessment when needed under good-change.md, but cannot supply either peer's assent.
5. Reconcile disagreements and user rulings in ordinary language. Republish affected conclusions or reopen continuing work explicitly. Saving a new evidence file alone does not update a published argument. Replaced parents are not automatically fixed by terminal children; explain what their actual outcomes establish about the original concern.
6. Pull eligible action or peer-agreement work at boundaries. Agreement settles that conclusion; it does not create an author acknowledgement or a mandatory composition phase. Continue other open work. A combined assessment needs its own remaining question, not another pass merely because both agreed. Save context before going idle; release finished checkout batches. The master reads and summarizes meaningful outcomes and blockers as they arise, even while other work continues. Report stopped, impossible and user-blocked outcomes honestly rather than waiting for everything to be green.

For a local deep run, use an independent context to challenge conclusions and account for the requested inputs before reporting; do not claim it was a two-investigator run. In a joint run, the investigators' replacement arguments and final conclusions account for the original concerns. Do not add a separate coverage stamp or repeat still-applicable reviews merely because a phase has a name.

## Master and decisions

Keep original concerns and their continuing replacements visible. Both investigators may raise questions; present consequential choices with options, user effect and recommendation from findings.md. A user wait remains open until the answer is recorded; do not infer an answer from elapsed time or preference. A ruling is user authority, not a vote by master in the investigators' engineering agreement.

When a user changes scope, retain the instruction and adjust the affected commitments explicitly. Restricted work stays visible rather than disappearing. Before check-in, retain authorization for the exact selected inputs and executor; the investigator checks review applicability, dependencies and actual checkout content. The helper never performs check-in or deployment.

Pull unread outcome attention during active work and whenever woken. Read the argument and timeline since acknowledgement; summarize the important stops, choices and reasons for the user, then acknowledge as ledger.md describes. Group updates without silently waiting for the whole run to finish. Acknowledging visibility is not engineering approval. An idle worker is not proof its conclusions are agreed, and an active process is not proof of progress.

## Runtime

Read this section for an unattended multi-agent run. Runtime command help owns current flags.

**Preflight and cast.** Confirm HERDR_ENV=1 and that herdr agent list succeeds from the coordinator's execution context. Obtain normal approval for sandbox-denied runtime access; never bypass it. Give the master an addressable name and start the named workers in visible panes. Bind each exact returned runtime identity to its configured actor. Reviewers need the record and task access, not runtime permission for every ledger mutation.

**Dispatch.** Give each worker its goal, role, frozen input, actual constraints, run directory, actor identity, pinned helper and initial task. Do not preload another investigator's conclusions into its independent pass or prescribe an unnecessary command itinerary. Messages follow agent-messaging when available. Follow ledger.md before spawning a child; its reserved task and one recorded execution survive uncertain delivery or context loss.

**Peer communication.** Save routine findings, disagreements, candidates and disclosures in the record rather than trying a peer message first. Busy workers pull at task boundaries. Interrupt for an urgent stop, possible interference, or changed instructions that cannot wait. In a Herdr run, use its agent surface for main-worker interruptions; harness-local subagent messaging does not address another harness's panes. If urgent contact fails, preserve the stop and surface failure to the user. A saved note is not delivered notice.

**Coordinator.** Run one pinned ledger coordinate watch process in an addressable background pane with approved runtime access. Bind investigators and master before explicitly enabling it; coordination starts paused. It observes action work, peer-agreement duties and unread master outcomes, waking their idle recipients. Overdue child-inspection reminders go to the recorded parent, with master attention when the parent is unavailable. Once all registered conclusions and replacement arguments are agreed and no checkout or execution remains held, it invites master to report outcomes and limits. It does not infer assignments or successful delivery from terminal children.

**Delivery and progress.** Persist attempts before sending. Busy workers are not interrupted by routine work; idle or done bound workers can be woken. Unknown, missing, blocked and replaced sessions are not assumed idle. An accepted prompt is not execution, task completion or a review verdict. Unchanged work that remains idle after observed activity, or one minute after acceptance without observed activity, becomes master attention rather than an endless prompt loop. That minute is an inspection checkpoint, not a completion deadline or proof of failure. An expired inspection requests a check; it never proves a child dead or authorizes a duplicate.

A recorded task start is an action checkpoint, not runtime liveness. Status separates assignments from cached runtime observations. A working investigator may hold the checkout to validate the peer's candidate even when its own action tasks are concluded; a non-working holder requires inspection, not automatic release.

**Stops and recovery.** Uncertain delivery pauses automatic sends and ends the watcher with a visible error until the master inspects and records a checked disposition. This is a local failure report, not a confirmed master message; keep the watcher output visible. A watcher restart does not clear uncertainty or pause. Before stopping workload, pause coordination, then stop affected workers through the runtime and preserve their work, dispatches and checkout state. A prompt already in flight may still arrive; it grants no ownership or authorization. Resume only through the authorized recovery path. Do not replay a saved mutation to obtain another wake or steal a checkout because its holder appears old.

**Limits.** The store cannot restart a stopped runtime. Keep the watcher visible so its failure is distinguishable from idle workers. In a local run without a coordinator, the parent owns child completion notifications and scheduled inspection through its product's wait mechanism. Close only panes and processes you created; never stop the Herdr server.
