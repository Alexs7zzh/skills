# Shared investigation

Read when starting or resuming substantive work, publishing a conclusion, replacing an issue, or editing a shared checkout. findings.md owns the argument and evidence standard; this file owns recording and coordination. deep.md owns joint investigation and runtime controls.

## Start and resume

Use a retained run directory. Set LEDGER_DIR and LEDGER_ME to the run and your configured actor. Read scripts/ledger.ts --help for commands. Initialization pins the helper under the run's bin/; use that copy throughout the investigation. A joint run names two equal investigators and a user-facing master. A local run can use master alone, but must not claim two-investigator agreement. Supporting children are executions, not additional voting identities.

Register the original questions or input clusters as tasks. Here, a task is an investigation node, not a coding phase or necessarily an initial input. Either investigator may register newly discovered issues. Save the current understanding, evidence pointers, rejected alternatives, next action and blocker before a work switch or context loss. Evidence records and checkpoint notes do not endorse a conclusion.

Resume by reading status, your relevant nodes and their retained notes. Use status with an issue id for its nested replacement view; shared children appear as cross-references rather than duplicate investigations. Read an issue's timeline when its history matters. Continue from retained artifacts instead of recreating the investigation because a turn ended.

## Ordinary coordination

Both investigators can investigate, implement, question and judge every issue. Ownership names who is acting next, not a primary investigator or exclusive authority over a conclusion. Claim unassigned action work before taking it over; edit against the revision read. Release with a usable note and next action without waiting for the successor. Only master may reassign another actor's held work; execution and checkout holds must still be respected.

Busy investigators pull the record between tasks. Unassigned action work reaches master for assignment; it is not automatically assigned to whichever worker is idle. A peer's published conclusion creates agreement work independently of action ownership. Either investigator can agree, publish a revised argument, or reopen the issue with the concrete reason. Do not turn agreement into an approval gate before experiments or child investigation.

Either investigator can add a checkpoint note or raise a user wait on an open issue, regardless of action ownership. Reopen a concluded issue before marking it blocked. Set a user wait when a decision only the user can make blocks this node. The action owner can set an external wait for missing access, observation or a resource. Name the resolver and what would allow work to continue. Neither wait makes the whole investigation stop. Master presents and records user rulings, not exclusive ownership of asking. Changes to the assigned action's outcome, inputs, next action or execution permission stay with its owner or master; independently saved evidence needs no transfer.

Master resolves a user wait with an exact, current, master-recorded ruling reference. The helper adds that ruling to the waiting task's inputs. The investigators identify other affected arguments and reopen or republish them when needed. External waits can be cleared by the action owner or master after the missing condition changes. To stop rather than keep waiting, explicitly clear the wait and publish the reason the investigation cannot continue; an unanswered user wait still needs a ruling, including a decision to cancel. Do not silently count waiting as finished.

## Conclusions and replacements

Retain the argument and supporting evidence as records. Publishing chooses that exact argument and a disposition: done, stopped, cancelled, or replaced. Done describes the conclusion claimed by its author, not successful engineering certified by the helper. State whether the outcome is fixed, not a defect, impossible, intentionally unchanged or another supported conclusion in plain language.

Publication is the author's endorsement. The other investigator must inspect the argument and evidence and agree against the current task revision. A material republication keeps the publisher's endorsement and clears the other investigator's agreement. A note edit or separately saved experiment changes neither endorsement. Previous conclusions and agreements remain in history. Do not save a changed argument as a new record and assume that alone updates a published conclusion: explicitly republish or reopen the affected node. The helper does not infer semantic impact through evidence links.

For replacement, register the one or more continuing issues first, then publish a replacement argument naming them. Both investigators judge whether that explanation accounts for the original concern, including excluded scope, newly discovered scope and unresolved work, per findings.md. Children may be investigated before the replacement is agreed. A child may serve several parents; reference it instead of duplicating it. The helper rejects missing children and cycles but does not distinguish subset, common cause, expansion or decomposition as machine rules.

A replaced parent remains replaced, not fixed. Terminal child outcomes do not prove its original goal succeeded. When reporting or changing course, explain what the children's actual outcomes mean for the original concern. A stopped or impossible child is a conclusion, not permission to label the parent fixed. Register or reopen continuing work explicitly; the helper never generates it from a verdict.

The run's recorded conclusions are jointly agreed only when every registered node, including replacements and children, has the investigators' assent, no node is still open or waiting, and no checkout or execution remains held. That is an accounting condition, not a proof of engineering truth. Results-ready invites master to report the agreed outcomes and limits; it does not authorize check-in. User-blocked partial results must be reported before that condition is reached.

## Master visibility

Publication, agreement changes, reopening and changed waits retain unread attention for master. Master reads the affected node, argument and timeline since the last acknowledgement, then summarizes meaningful changes for the user: chosen and rejected approaches, why scope changed, impossible outcomes, blockers and required rulings. Group related updates without waiting for the whole run to end. The timeline preserves successive changes even if several occur before master reads them.

After reading and accounting for those changes, master acknowledges the node's current revision. Acknowledgement records visibility only; it does not agree with the conclusion or resolve a wait. Merely reading a status report does not clear attention. Reasons live in the record, not duplicated in every runtime prompt. An active master must pull unread outcomes at work boundaries; an idle master can be woken by the coordinator.

## Child executions

Reserve one dispatch for an action task before launching a child. Record the returned worker identity and observed running state; a reservation is not a confirmed launch. The task's action owner remains the child's parent. Use dispatch show to recover the exact identity, revision and observations after context loss. An active dispatch prevents duplicate launch, transfer or conclusion changes on that node until the execution is reconciled.

A child returns evidence and its argument to its parent. Retain the actual attribution and supplied input versions in the record content; the parent is its recorder, not necessarily its author. The investigators still make their own judgments and record their own agreement. A child cannot cast a peer's vote. Child completion alone does not conclude the node.

Record finished or stopped only from observed outcomes; retain partial evidence and uncertainty. Inspection times require attention, not an inference that the child died or permission to replace it. Do not drop or relaunch a child merely because a conversation turn ended.

## Shared checkout

One writer holds the shared checkout. Acquire it successfully before any shared edit, including docs and temporary probes. Task ownership and peer agreement do not grant the checkout. Hold it while a build consumes mutable inputs, or use an immutable copy. Review saved candidate and baseline bytes, not an unidentified mix in a moving tree.

Before releasing, retain candidate, baseline including user edits, validation and unfinished work; remove temporary instrumentation without undoing candidate or user changes. Release a finished batch even if other nodes remain. A missing writer never automatically frees the hold. Master recovery requires evidence that it stopped or cooperates and that its work is preserved.

If you edited under another writer's hold, stop further shared writes, including rollback; preserve your diff and urgently contact the holder and master. A later byte comparison does not establish absence of interference.

## Scope, messages and recovery

Scope and exact check-in authorization restrict execution. Publishing a stopped investigation is reporting, not permission to perform its blocked action. Never relabel write work as reading to bypass scope. The helper performs no source edits, check-in, deployment or publication. Selection, actual tree verification and user authority remain necessary outside the database.

Routine results and disclosures are recorded, not sent to peers first. Urgent interference, duplicate execution or lost delivery requires actual stop notification through deep.md. A saved note is not confirmed delivery.

Ordinary argument or stale-revision refusals with no mutation are invocation repair: inspect, correct and continue. Inspect the record before retrying an uncertain outcome. Do not replay a saved mutation merely to obtain a wake.

Schema 11 does not migrate old task/review records or invent peer assent. Keep old runs on their pinned helper. A deliberate continuation carries forward applicable arguments, candidates, unresolved choices and responsibility into the new format, with old records linked and preserved. It need not repeat still-applicable investigation.
