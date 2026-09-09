# Joint work ledger

Read when starting or operating the joint investigation's ledger. Normal and solo deep work do not use it. [joint.md](./joint.md) owns engineering agreement, replacement meaning, completion, master reporting and runtime controls. This file owns the commands' use, ownership and shared checkout. The pinned helper's `--help` supplies exact command syntax.

## Start and resume

Use a retained run directory. Set LEDGER_DIR and LEDGER_ME to the run and your configured actor. Read scripts/ledger.ts --help for commands. Initialize with the goal, scope authority, two investigators and user-facing master. Initialization pins the helper under the run's bin/; use that copy throughout the investigation. Supporting children are executions, not additional voting identities.

Register questions or issues with `task add`. A task is an investigation node, not a coding phase. Retain argument and evidence records as needed; follow findings.md for their content and continuity.

Resume by reading status, your relevant nodes and their retained notes. Use status with an issue id for its nested replacement view; shared children appear as cross-references rather than duplicate investigations. Read an issue's timeline when its history matters. Continue from retained artifacts instead of recreating the investigation because a turn ended.

## Ordinary coordination

Claim unassigned action work before taking it over; edit against the revision read. Release with a usable note and next action without waiting for the successor. Only master may reassign another actor's held work; execution and checkout holds must still be respected.

Unassigned action work reaches master for assignment; it is not automatically assigned to whichever worker is idle. A peer's published conclusion creates agreement work independently of action ownership.

Either investigator can add a checkpoint note or raise a user wait on an open issue, regardless of action ownership. Reopen a concluded issue before marking it blocked. For a user decision identified through findings.md, set a user wait on the affected node. The action owner can set an external wait for missing access, observation or a resource. Name the resolver and what would allow work to continue. Changes to the assigned action's outcome, inputs, next action or execution permission stay with its owner or master; independently saved evidence needs no transfer.

Master resolves a user wait with an exact, current, master-recorded ruling reference. The helper adds that ruling to the waiting task's inputs. External waits can be cleared by the action owner or master after the missing condition changes. To stop rather than keep waiting, explicitly clear the wait and publish the reason the investigation cannot continue; an unanswered user wait still needs a ruling, including a decision to cancel.

## Conclusions and replacements

`task publish` selects an exact result record and a disposition: done, stopped, cancelled, or replaced. It can instead retain a file and publish it atomically. A refused transaction may leave an unreferenced retained artifact, but never a partial record/task update. These dispositions record the author's claim under joint.md, Agreement; the helper does not certify its truth.

Use `task agree` against the revision examined. Use `task publish` to revise a published argument or `task reopen` to resume investigation. The assent rules and when a change requires either action live in joint.md, Agreement.

For replacement, register continuing issues first, then publish the replacement argument with their ids. The helper rejects missing children and cycles; shared children are allowed. Follow joint.md, Replacement, for what the argument must establish.

Mutation receipts return affected revisions and retained references. `status ID` shows nested replacements and cached runtime observations without contacting the runtime. `report` includes arguments and waits. Task counts are not counts of verified findings; interpret readiness through joint.md, Completion.

## Master visibility

Publication, agreement changes, reopening and changes to or from user/external waits retain unread attention for master. Routine checkout waits do not. The timeline preserves successive changes even if several occur before master reads them. Follow joint.md, Master and decisions, to read and report that attention.

After reading and accounting for changes, master uses `task ack` with the node's current revision. It clears attention without revising the task, agreeing with the conclusion or resolving a wait. Reading a status report alone does not clear attention.

## Child executions

Reserve one dispatch for an action task before launching a child. Record its actual runtime handle as name and retain pane/session identifiers when that runtime supplies them; use null for unavailable fields, never an invented pane. Record the observed running state; a reservation is not a confirmed launch. The task's action owner remains the child's parent. Use dispatch show to recover the exact identity, revision and observations after context loss and inspect it through its original runtime. An active dispatch prevents duplicate launch, transfer or conclusion changes on that node until the execution is reconciled.

A child returns evidence and its argument to its parent. Retain the actual attribution and supplied input versions in the record content; the parent is its recorder, not necessarily its author. Child completion alone does not conclude the node.

Record finished or stopped only from observed outcomes; retain partial evidence and uncertainty. Inspection times require attention, not an inference that the child died or permission to replace it. Do not drop or relaunch a child merely because a conversation turn ended.

## Shared checkout

One actor holds the shared checkout. Acquire it successfully before any shared edit, including docs and temporary probes. Task ownership and peer agreement do not grant the checkout. The hold serializes access; it grants no source-edit authority. Report-only investigators can take it to keep build and test inputs stable. Hold it while a build consumes mutable inputs, or use an immutable copy. Review saved candidate and baseline bytes, not an unidentified mix in a moving tree.

A busy checkout blocks shared edits and mutable-input checks, not investigation. Continue independent code reading, saved-candidate review, or other issues. When a task's next remaining action needs the checkout, set `wait=checkout` with that action as its reason, not an external wait. Eligibility follows current availability: free or already held by that task's owner. Release makes waiting work eligible without a clearing mutation or a new permission decision; the owner must still acquire the checkout before using it. Clear the wait when further work no longer needs shared inputs. Do not idle while other useful work is available.

Before releasing, retain candidate, baseline including user edits, validation and unfinished work; remove temporary instrumentation without undoing candidate or user changes. Release a finished batch even if other nodes remain. A missing writer never automatically frees the hold. Master recovery requires evidence that it stopped or cooperates and that its work is preserved.

If you edited under another writer's hold, stop further shared writes, including rollback; preserve your diff and urgently contact the holder and master. A later byte comparison does not establish absence of interference.

## Scope, messages and recovery

Scope restricts execution; publishing a stopped investigation does not authorize its blocked action. Never relabel write work as reading to bypass scope. The helper records work; it does not execute project actions.

For runtime messages, urgent stops and uncertain delivery, follow joint.md, Runtime.

Ordinary argument or stale-revision refusals with no mutation are invocation repair: inspect, correct and continue. Inspect the record before retrying an uncertain outcome. Do not replay a saved mutation merely to obtain a wake.
