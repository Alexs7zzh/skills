# Joint investigation

Read for the joint level selected in SKILL.md. Use the deep investigation method with two equal investigators and a shared ledger. This file owns their agreement, replacement explanations, completion and runtime responsibilities. Read [ledger.md](./ledger.md) when starting or operating the shared record. Read [findings.md](./findings.md) for investigation records and user decisions.

## Roles

The user-facing master retains the requested input, carries user rulings, coordinates workers and summarizes their arguments and stops throughout the run. The two investigators have equal authority to discover, implement, challenge conclusions and raise questions. They pursue the same investigation; action assignments avoid interference without making either seat primary.

Use the user's chosen model and effort setting for each investigator. If either choice is missing from the current task's instructions, ask before starting the investigators; the skill has no model or effort defaults. The user may explicitly choose the runtime's default effort. Retain these choices with the run and reuse them on continuation, rather than asking again. Both investigators can investigate and write through the shared checkout contract. A fresh reader is a separate execution, not a continuing reviewer changing its label. If the shared runtime or either chosen model is unavailable, retain the applicable work and report the missing prerequisite. Do not substitute another model or solo investigation for the requested joint run; a change needs the user's direction.

## Work together

Give both investigators the same goal, rulings, baseline and available evidence. Register original questions or input clusters; a clean investigation need not manufacture bugs. Each investigator saves independent observations before comparing the peer's conclusions. This is an exposure boundary, not database secrecy. Reading and reasoning about an issue require no action ownership.

Either investigator can develop candidates, register discoveries and challenge conclusions. Pull eligible action or peer-agreement work at boundaries; continue other useful work while one issue waits. Save context before going idle and release finished checkout batches. Agreement settles a conclusion without creating an author acknowledgement or another mandatory review phase. Further passes need a remaining uncertainty or uncovered obligation. Before costly shared validation, resolve known source objections and combine compatible changes when that avoids repeating the check. Follow the user's validation owner and handoff boundary; this does not require peer approval before every experiment.

## Agreement

Publish each substantive conclusion with a compact argument naming the claim and exact candidate, the scenario or source check actually completed and its result, and any uncovered inputs or remaining work with its continuing issue. References to retained evidence can fill these slots. State the actual outcome in plain language: fixed, statically reviewed with execution pending, not a defect, intentionally unchanged, impossible, or another supported result. A static-only handoff does not claim a passing build or runtime validation. The peer examines the claim, candidate and evidence together before agreeing against the exact task revision checked. Assessments and changed inputs follow findings.md, Continuity. Both investigators' assent is required for final conclusions and replacement explanations, not intermediate hypotheses or experiments. A child assessment cannot supply either investigator's assent.

Publication endorses its author's argument and clears the peer's agreement. Keep cosmetic edits in notes; observations, evidence uploads and checkpoints alone change neither endorsement. When findings.md's applicability check identifies an affected conclusion, explicitly republish or reopen it; the helper cannot infer that impact from a saved record. The peer checks a condition's resolution before the conclusion is treated as agreed, even if the candidate did not change.

Reconcile disagreement with a concrete reason or remaining uncertainty. A different possible design alone does not reopen settled work. Peer agreement does not accept tradeoffs on the user's behalf; apply the user-decision rules in findings.md.

## Replacement

When an issue should continue through one or more others, register those continuing issues and publish a replacement argument. Explain why they account for the original concern, including excluded scope, added scope and unresolved work. The same rule covers duplicates, a narrower actionable subset, a broader cause and a split into several investigations. Reuse existing issues where appropriate. Both investigators judge the explanation; either can investigate the continuing issues before agreement, subject to action and checkout ownership.

A replaced parent remains replaced, not fixed. When continuing issues conclude, explain what their actual outcomes establish about the original concern. Terminal children, including stopped or impossible outcomes, do not prove that the parent's goal succeeded. Register or reopen remaining work explicitly. The helper checks links and cycles, not the engineering meaning of a replacement.

## Completion

The joint investigation concludes when both investigators agree on the substantive outcomes and replacement explanations accounting for the requested scope. In the ledger, every registered node, including replacements and children, must have both investigators' assent, no node may remain open or waiting, and no checkout or execution may remain held. This accounting condition does not prove the claims. Empty eligible work and idle workers are not completion.

An impossible, deferred or intentionally stopped outcome can conclude the promised assessment when its reason and remaining action are explicit and agreed; it is not a successful fix. A user wait remains open until the user answers or changes the scope. Report partial results and disagreements while work remains blocked. Retain useful proposals and candidates for continuation.

## Master and decisions

Keep original concerns and their continuing replacements visible. Both investigators may raise questions; present consequential choices through findings.md. A ruling is user authority, not a vote by master in the investigators' engineering agreement. Record waits and their resolution through ledger.md; elapsed time or an inferred preference cannot supply the answer.

When a user changes scope, retain the instruction and adjust affected commitments explicitly. Restricted work stays visible rather than disappearing.

Pull unread outcome attention during active work and whenever woken. Read the argument and timeline since acknowledgement, then acknowledge as ledger.md describes. Give the user an update when it adds a consequential result, decision, limitation or blocker beyond the last update; group related publication and peer-review changes. An unchanged conclusion gaining assent does not require a separate user-facing message. Surface new approval needs, changed scope and final limitations promptly. Acknowledging visibility is neither engineering approval nor an obligation to narrate every transition. Routine waiting on an active peer need not interrupt the user; an active process is not proof of progress.

## Runtime

Use these controls for the joint runtime. Runtime command help owns current flags.

**Preflight and cast.** Confirm HERDR_ENV=1 and that herdr agent list succeeds from the coordinator's execution context. Obtain normal approval for sandbox-denied runtime access; never bypass it. Give the master an addressable name. For a new run, use the layout below unless the user requests another. Start the named workers in the investigator panes and bind each exact returned runtime identity to its configured actor. Reviewers need the record and task access, not runtime permission for every ledger mutation.

**New-run layout.** Keep the master in its current tab. Put the coordinator monitor immediately to its right, targeting 10% of their combined width, with 90% for the master. Create one new tab in the same workspace, using the project's working directory, for the two investigators; split it side by side, 50/50. Preserve the user's focus and unrelated panes. Herdr's split ratio is the existing left pane's share: a right split with ratio `0.9` makes the new monitor 10%; use `0.5` for the investigator pair. Inspect the returned layout to verify positions and widths. If runtime minimum sizes prevent the requested width, keep the closest supported layout and report the actual size. On resumption, reuse the bound panes and monitor without creating duplicates or rearranging the run.

**Dispatch.** Give each worker its goal, role, frozen input, actual constraints, run directory, actor identity, pinned helper and initial task. Do not preload another investigator's conclusions into its independent pass or prescribe an unnecessary command itinerary. Messages follow agent-messaging when available. Follow ledger.md before spawning a child; its reserved task and one recorded execution survive uncertain delivery or context loss.

**Peer communication.** Save routine findings, disagreements, candidates and disclosures in the record rather than trying a peer message first. Busy workers pull at task boundaries. Interrupt for an urgent stop, possible interference, or changed instructions that cannot wait. In a Herdr run, use its agent surface for main-worker interruptions; harness-local subagent messaging does not address another harness's panes. If urgent contact fails, preserve the stop and surface failure to the user. A saved note is not delivered notice.

**Coordinator.** Run one pinned ledger coordinate watch process in the monitor pane with approved runtime access. Bind investigators and master before explicitly enabling it; coordination starts paused. It observes action work, peer-agreement duties and unread master outcomes, waking their idle recipients. Overdue child-inspection reminders go to the recorded parent, with master attention when the parent is unavailable. Results-ready invites master to report the outcomes and limits under Completion above. It does not infer assignments or successful delivery from terminal children.

**Delivery and progress.** The coordinator retains attempts and delivery uncertainty; do not implement a second retry loop. Inspect its attention when delivery or progress is unresolved. An accepted prompt is not execution, task completion or a review verdict. An inspection deadline requests a check, not a conclusion that a child died or authorization for a duplicate. Busy workers pull routine work; interrupt only for the urgent cases above.

A recorded task start is an action checkpoint, not runtime liveness. Status separates assignments from cached runtime observations. A working investigator may hold the checkout to validate the peer's candidate even when its own action tasks are concluded; a non-working holder requires inspection, not automatic release.

**Stops and recovery.** Uncertain delivery pauses automatic sends and ends the watcher with a visible error until the master inspects and records a checked disposition. This is a local failure report, not a confirmed master message; keep the watcher output visible. A watcher restart does not clear uncertainty or pause. Before stopping workload, pause coordination, then stop affected workers through the runtime and preserve their work, dispatches and checkout state. Inspect in-flight jobs and confirm the workers and their owned jobs have stopped before changing their inputs or recovering ownership. A prompt already in flight may still arrive; it grants no ownership or authorization. Resume only through the authorized recovery path. Do not replay a saved mutation to obtain another wake or steal a checkout because its holder appears old.

**Limits.** The store cannot restart a stopped runtime. Keep the watcher visible so its failure is distinguishable from idle workers. Close only panes and processes you created; never stop the Herdr server.
