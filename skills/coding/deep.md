# The deep run

Coordination for broad coverage and independent investigation. review.md and diagnose.md gather inputs; good-code.md, good-change.md and findings.md govern engineering judgment. ledger.md owns task, record, dispatch and checkout mechanics. The helper does not conduct a coding phase sequence.

## Roles

The user-facing master freezes the requested input, carries user rulings, coordinates workers and presents their evidence-backed results. Investigators own code judgment. Without an available shared runtime, the user-facing agent investigates locally and uses fresh subagents for bounded independent checks; state the independence actually achieved.

For a two-family run, use reviewer A on Claude Opus at high effort and reviewer B on Codex gpt-5.6-sol at high effort. Both can investigate and write through the shared checkout contract. A fresh reader is a separate execution, not a continuing reviewer changing its label.

## Work together

1. Freeze the goal, relevant user rulings, baseline, working-tree changes and available evidence. Retain the input as records, and create owned discovery tasks for the intended coverage. A clean investigation still delivers a coverage result; do not invent issues to fill the database.
2. Discover independently against that input. Each investigator records its own analysis artifact before reading the peer's conclusions. Use separate notes and revision-based or isolated reads. There is one shared task store, not a second cold-mode protocol: this is a methodological exposure boundary, not enforced data secrecy.
3. Develop the candidate while the investigation is in context. Record claim, alternatives, evidence and candidate together where useful. A task can span those activities. Do not wait for intermediate stamps; create another task only for independently assignable work or a separately blocked result.
4. Explicitly assign a fresh review task against saved subject and input versions. Its owner handles dispatch and remains responsible for that execution. The reader follows good-change.md, Review the result, records its own assessment, and only then compares the author's rationale. Candidate edits or implementation ownership changes do not reassign the reader's parent.
5. Reconcile concrete conditions, dependencies and user decisions. Retain old-input assessments as history, not approval of changed inputs. Where a result needs follow-up, reopen or create an owned task explicitly; no script infers the next engineering activity from a verdict.
6. Pull another useful task or preserve your state and go idle. Waiting on a reader or user blocks that task, not everything you own. Release a finished checkout batch. Report at any time when requested; distinguish delivered results, unresolved commitments, historical assessments and unknowns. Task completion alone is not engineering acceptance.

For a local deep run, also use a fresh context to check coverage and claims for missed obligations before reporting. Do not repeat still-applicable candidate reviews merely to add another stamp. Notes retain useful retrospective deltas and the goal/domain scenarios checked; pass counts are optional descriptions, not gates or quotas.

## Master and decisions

Keep the goal and each requested outcome accounted for by an owned task, a retained result, or an explicit open decision. Present consequential questions with the actual options, user effect and recommendation from findings.md. A user-blocked task remains visible until the user's answer is recorded; do not infer an answer from elapsed time or a plausible implementation preference.

When a user changes scope, retain the instruction and adjust the affected commitments explicitly. Restricted work stays visible rather than disappearing. Before check-in, retain authorization for the exact selected inputs and executor; the investigator checks review applicability, dependencies and actual checkout content. The helper never performs check-in or deployment.

Reports explain outcomes and evidence, not just task counts. An idle worker is not proof that all its work is complete, and an active process is not proof of progress. Read task notes and recorded runtime observations rather than reconstructing an authoritative history from thinking traces.

## Runtime

Read this section for an unattended multi-agent run. Runtime command help owns current flags.

**Preflight and cast.** Confirm HERDR_ENV=1 and that herdr agent list succeeds from the coordinator's execution context. Obtain normal approval for sandbox-denied runtime access; never bypass it. Give the master an addressable name and start the named workers in visible panes. Bind each exact returned runtime identity to its configured actor. Reviewers need the record and task access, not runtime permission for every ledger mutation.

**Dispatch.** Give each worker its goal, role, frozen input, actual constraints, run directory, actor identity, pinned helper and initial task. Do not preload another investigator's conclusions into its independent pass or prescribe an unnecessary command itinerary. Messages follow agent-messaging when available. Follow ledger.md before spawning a child; its reserved task and one recorded execution survive uncertain delivery or context loss.

**Peer communication.** Save routine findings, disagreements, candidates and disclosures in the record rather than trying a peer message first. Busy workers pull at task boundaries. Interrupt for an urgent stop, possible interference, or changed instructions that cannot wait. In a Herdr run, use its agent surface for main-worker interruptions; harness-local subagent messaging does not address another harness's panes. If urgent contact fails, preserve the stop and surface failure to the user. A saved note is not delivered notice.

**Coordinator.** Run one pinned ledger coordinate watch process in an addressable background pane with approved runtime access. Bind the dispatched workers and master before explicitly enabling it; coordination starts paused. It observes explicitly owned work and runtime identities, wakes idle owners, and routes overdue child inspections to their recorded parent or to the master when that parent is unavailable. Once every explicit commitment has a result or cancellation and no checkout or execution remains held, it invites the master to inspect and report. It does not infer coding assignments or correctness.

**Delivery and progress.** Persist attempts before sending. Busy workers are not interrupted by routine work; idle or done bound workers can be woken. Unknown, missing, blocked and replaced sessions are not assumed idle. An accepted prompt is not execution, task completion or a review verdict. Unchanged work that remains idle after observed activity, or one minute after acceptance without observed activity, becomes master attention rather than an endless prompt loop. That minute is an inspection checkpoint, not a completion deadline or proof of failure. An expired inspection requests a check; it never proves a child dead or authorizes a duplicate.

**Stops and recovery.** Uncertain delivery stops automatic retries until the master inspects and records a checked disposition. A watcher restart does not clear uncertainty or pause. Before stopping workload, pause coordination, then stop affected workers through the runtime and preserve their work, dispatches and checkout state. A prompt already in flight may still arrive; it grants no ownership or authorization. Resume only through the authorized recovery path. Do not replay a saved mutation to obtain another wake or steal a checkout because its holder appears old.

**Limits.** The store cannot restart a stopped runtime. Keep the watcher visible so its failure is distinguishable from idle workers. In a local run without a coordinator, the parent owns child completion notifications and scheduled inspection through its product's wait mechanism. Close only panes and processes you created; never stop the Herdr server.
