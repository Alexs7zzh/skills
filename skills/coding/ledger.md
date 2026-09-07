# Shared work record

Read when starting or resuming substantive work, assigning an independently deliverable result, or editing a shared checkout. findings.md owns evidence and engineering conclusions; this file owns durable coordination. Deep model/runtime choices live in deep.md.

## Start and resume

Use a retained run directory in the project's ignored working folder, or a fresh temporary directory. Set LEDGER_DIR and LEDGER_ME to the run and your actual actor name. Read the skill's scripts/ledger.ts --help for initialization and commands. Initialization pins the helper under <run>/bin/; use that copy for the rest of the run. Local work can use master as its sole actor; a shared run names its workers and master explicitly. Changing topology does not change the meaning of a task.

Start with the goal, explicit scope instruction and a task describing the outcome to deliver. Do not manufacture an issue before investigation. One task can hold hypothesis, candidate development and reconciliation; make a separate task when its result can be independently assigned or one part must wait while another continues. A mechanical presentation edit still follows SKILL.md's direct path without a ledger.

On resumption, read status, your task and its note before rediscovering anything. Keep the note short: current understanding, retained evidence, next useful action and any blocker. Save it before switching work, long waits or context loss. Full reasoning and saved inputs live in versioned records and retained files. Use the timeline when a decision's history matters, not as the default reading stack.

## Ordinary coordination

A task is an explicit commitment, not an inferred coding phase. It names an owner or is visibly unassigned. Claim available work atomically before acting as its owner; update using the revision you read. Only the owner or an explicitly authorized recovery changes responsibility. Releasing work retains its note and inputs and does not wait for the successor to take it. Transferring implementation work does not transfer a separately assigned review.

Status distinguishes your work, unassigned opportunities, running work, blocked tasks, finished results and cancellations. Choose the useful next action within the authorized scope. Do not treat every available item as a requirement to take it. Finishing records delivery of the task's stated result; it does not certify the engineering outcome. Cancel only when that commitment is withdrawn, with its reason and required human authority retained.

Unassigned work notifies only the master. Workers may claim visible unassigned work at task boundaries, but being the only idle worker does not assign it to them. This deliberately accepts master-dispatch latency rather than introducing implicit ownership.

When waiting, name the actual resolver. A dependency names another task's result and version. A user wait names the decision needed and its effect; an external wait names the missing access, observation or resource. Waits retain responsibility and block only the affected task. Continue independent work. A cancelled or revised prerequisite requires reconciliation, not automatic success, recursive cancellation, or endless waiting for a result that cannot arrive.

To resolve a user wait, the master retains the user's answer and source as a ruling record and supplies its exact revision. The helper incorporates that ruling into the waiting task's inputs and advances its material version, so dependent work must reconcile. The recorder must also identify other affected tasks and assessments and include the ruling in their material inputs; the helper cannot discover semantic dependencies that were never declared. Preserve earlier assessments as history, not approval under the new ruling.

Scope changes restrict declared read/write/check-in permissions while keeping work visible. Record the user's actual instruction; do not relabel write work as read-only to bypass it. Check-in authorization is explicit, tied to the selected inputs and current scope. The helper never executes source edits, check-in, deployment or publication; those actions still require the user's authority and the project's checks.

## Saved inputs and independent review

Save material inputs as immutable record versions: a goal/ruling, candidate and exact baseline, validation evidence, or an assessment. The kind and title help people find them; they do not generate assignments. The helper retains supplied files by content identity. Large external artifacts need a recoverable exact reference and stated access limits, not a moving branch or an unexplained filename.

Materiality is the recorder's judgment: saving a new record revision declares that its dependents must reconcile before being relied on as current. Completed old-input assessments remain history, not automatically assigned work. Put cosmetic wording or clarification that leaves checked content unchanged in the task note instead. The helper does not compare prose to decide whether a revision matters.

Create a review task explicitly, naming its owner, saved subject and all material input versions. That owner arranges the reader and stays responsible while it runs. Candidate authorship does not choose a new parent behind their back. An assessment names its actual author, exact inputs, verdict and conditions. Old-input work can be retained as history without becoming approval of current inputs. findings.md governs whether evidence remains applicable and what judgment a clean review establishes.

Before launching a child, reserve one dispatch for its task. Record the actual worker identity and running state after launch. Keep the brief and runtime identity with the record. A reserved dispatch is not a confirmed launch. An uncertain launch stays reserved until inspected; postponing inspection must not invent a running or stopped process. A running dispatch prevents a duplicate launch or ownership transfer until that execution is reconciled.

A child returns its assessment artifact to the parent; it need not impersonate a configured main actor to write the ledger. The parent records the observed dispatch outcome and retains the assessment with that dispatch's attribution. The parent is its recorder, not its author. Finishing the review task requires the returned assessment, not merely the child's exit.

If inputs change, choose deliberately whether the same child finishes its old-input assessment or receives a revised task. Do not replace the child merely because the candidate changed. Preserve its earlier inputs and result. Record finished or stopped from the observed outcome, with partial work retained; a child finishing without the promised result is not task completion. Inspection times create accountable attention, never permission to steal ownership or declare a process dead.

## Shared checkout

One writer holds the shared checkout. Acquire it successfully before any shared edit, including docs and temporary probes. Task ownership is not checkout ownership. Hold it while a build or test consumes mutable inputs, or use an immutable copy. Reviewers inspect the saved candidate and baseline, not an unidentified mixture in a moving working tree.

Before releasing, retain the candidate, relevant baseline including user edits, validation and unfinished work; remove temporary instrumentation without undoing candidate or user changes. Release a finished batch even when other tasks remain. A missing or expired writer never automatically frees the checkout. Recovery requires confirming it has stopped or cooperates, preserving its work, and recording that evidence before explicitly clearing its hold.

If you edited under another writer's hold, stop further shared writes, including rollback, preserve your diff separately and urgently notify the holder and master per deep.md. A later byte comparison does not establish that no interference occurred.

## Messages and stops

Mutations save facts without contacting the agent runtime. Busy workers pull the record between tasks. Ordinary results and disclosures do not need a duplicate peer message. The coordinator wakes idle owners and surfaces missing progress; an accepted wake is not execution or completion. An idle/handoff note preserves context but does not erase responsibility or silence work.

A rejected argument with no saved mutation is ordinary invocation repair: read the error/help, correct the command and continue. Inspect the record before retrying an uncertain outcome. Stop and urgently notify the master for lost or uncertain delivery, conflicting ownership, duplicate execution, or a valid action blocked by broken coordination. A saved note is not confirmed stop delivery. deep.md owns runtime controls and pause/recovery.
