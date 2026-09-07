# The deep run

Coordination for a review or diagnosis that needs broad coverage and independent investigation. The route gathers the input; good-code.md and good-change.md govern judgment; findings.md owns evidence, records, dependencies, and completion. Choose your role before starting.

## Roles

| You are | Role |
|---|---|
| The user-facing session with a working Herdr runtime | Master: gather, dispatch, carry user decisions, and present the record |
| The user-facing session without that runtime | Local reviewer: investigate here and use fresh subagents for independent checks |
| Dispatched by the master | Reviewer: investigate the frozen input, then work from the shared record |
| Dispatched to check a candidate | Fresh reader: follow good-change.md, Review the result, for the named candidate |

A local run can provide a fresh non-author check without providing two model families. State which independence the run actually achieved. Do not imitate another model or reuse your own context as a fresh review.

## Working loop

1. **Cover the input.** Partition changed hunks or diagnosis clusters into scoped sweeps, covering the applicable objects in good-code.md, Enumerate. Use subagents for bulk and retain the code model and judgment in the reviewer. Missing coverage stays visible.
2. **Discover independently.** In a two-family run, each reviewer uses its own cold database and reads the frozen revision and working-tree diff without seeing the other's conclusions. Use revision-based reads or an isolated copy so later edits cannot change that input. Read-only checks and experiments in an isolated copy can contribute evidence. Import the cold record before editing the shared checkout; the other reviewer can continue its cold pass against the frozen input.
3. **Develop and challenge.** Pull ready work from the shared database. The investigator may develop a candidate before the issue or proposal has a mark, per good-change.md. The other reviewer can investigate a claim directly or examine it with the candidate. Reuse applicable evidence and record disagreements with the check or decision that would settle them.
4. **Save and review.** Retain the recoverable candidate, baseline, dependencies, and validation record per findings.md. A fresh reader checks the claim and candidate together. Use ledger.md, Fresh reviews, to identify the one arranger and the reader's identity; a continuing conversation cannot unsee its prior arguments. Defects return as concrete conditions for the author.
5. **Handle decisions and interactions.** Apply findings.md to related issues, changed dependencies, and user questions. A question blocks its affected work; the investigator saves what it learned and takes another ready item. Engineering disagreement continues through evidence unless it exposes a decision only the user can make.
6. **Handoff or report.** Keep working while you have ready work. When none remains, save unfinished state, release the checkout, and run `ledger handoff`. A report follows findings.md, Completion, and the route's reporting section. Open work stays open. A user answer or changed dependency resumes the same record.

In a local deep run, use a single-seat database and omit the two-family cold/import exchange. Before reporting, send the current issues, supporting evidence, and clean coverage to a fresh subagent to look for missed obligations. Candidate checks use fresh readers as above. A broad independent pass earns its time by checking coverage and claims; it does not repeat already applicable candidate reviews merely to stamp them again.

## Ledger runtime

Read [ledger.md](./ledger.md) when starting or resuming a record or editing the shared checkout. It supplies the common setup and checkout rules; substantive local work uses the same record without the two-family exchange.

## Master

You carry the user's goals and decisions; reviewers own code judgment. Messages to agents follow the agent-messaging skill when available.

- **Gather.** Follow the route's Gather the input section. Freeze the target revision, working-tree diff, and available artifacts. Do not decide causes or design fixes while assembling input. Choose a recoverable shelve form from the project convention or supported VCS; ask only when a material constraint prevents choosing one. Initialize a joint database with both reviewers and yourself.
- **Dispatch.** Start the reviewers per Herdr runtime. Give them the frozen input, checkout, record, and actual user constraints. Tell the user that consequential questions appear as they arise and status is available.
- **Route questions.** Present a question from the record with the other open decisions and its recommendation. Record the user's answer and source; do not answer for them or infer approval from elapsed time. The script returns the answer to the affected reviewer.
- **Report status.** Use `ledger status` and the runtime's agent states. Separate recorded activity from inference; ready work does not prove that an agent is executing it. Surface blocked work and what would unblock it.
- **Present results.** Use `ledger report` when ready or requested, with open items visible. For time spent or earlier decisions, use `ledger timeline` and the retained artifacts. Do not reconstruct an authoritative history from guesses about session activity.
- **Carry authorization.** Apply the user's selection to reviewed candidates, including dependencies, per findings.md. Record the authorized executor and changesets. A general progress question is not check-in permission.

## Reviewer

- In a joint run, finish independent discovery in your cold record, then import it. Each declared scope has a covered outcome or an explicit gap; an unfinished sweep stays cold. Claim verification and candidate development can continue after import. In a local run, investigate directly in the single-seat record.
- Work from `ledger status`: open coverage, candidate development, claims to check, candidate reviews, and conditions on your work. Keep issue-to-candidate continuity; resume another investigator's retained work through ledger.md, Cooperative handoff.
- A fresh reader records its own assessment. Keep the author's rationale available for comparison after that assessment, and for the user.
- Maintain notes with `passes:` counts and useful `retrospective:` deltas. For a review, include Goal closure and Domain scenarios per review.md. Counts describe work, not confidence.
- When ready work is empty, preserve the next step, release the checkout, and hand off. A later prompt resumes the record rather than rebuilding the investigation.

## Herdr runtime

Read for a two-family run. The method is above; `herdr <command> --help` supplies flags.

**Preflight.** Check `HERDR_ENV=1` and that `herdr agent list` succeeds. Each reviewer checks runtime access from the same execution context it will use for joint-ledger mutations; the master's access does not establish the reviewer's. These mutations also send agent prompts, so filesystem access to the database alone is insufficient. If a sandbox denies runtime access, obtain the normal tool approval for that execution context; do not bypass the sandbox. If runtime access is unavailable, use the local role and state the missing two-family capability.

**Cast.** Reviewer A is Claude Opus at high effort, database seat A. Reviewer B is Codex `gpt-5.6-sol` at high effort, seat B. Each can use subagents; both write through the checkout contract above.

**Layout.** Create one tab named for the task and one pane per reviewer, side by side. Give your own agent an addressable name with `herdr agent rename`. Start reviewers with `herdr agent start <name> --kind claude|codex --pane <pane-id>`. Parse returned IDs rather than guessing; use `--no-focus`.

**Dispatch.** Carry the route and target, reviewer identity, paths for frozen input and checkout, `LEDGER_DIR`, `LEDGER_ME`, pinned helper, how far to go, and actual user constraints. Point at this skill and the Reviewer role. Carry relevant rulings and goals; do not prescribe the investigation or pre-load another reviewer's argument.

**Messaging and idle time.** The script sends ready-work changes, handoffs, and user answers to reviewers, and questions and completion notices to the master. Each message names its run directory and recipient seat; use that record context, since row IDs can repeat across runs. Notification intent is saved with the mutation, and unsettled delivery stays visible on resumption. The sender owns reconciliation; its parent or master carries that responsibility if the sender cannot resume. Check the recorded outcome and recipient before retrying: acceptance can precede an interruption or timeout. Do not repeat the saved mutation or accepted notifications. Intentional print-only delivery is distinct from unconfirmed transport. Follow any task-specific stop rule before recovery. Work until nothing is ready, hand off, then go idle and resume on a message. Avoid polling or waiting on another reviewer's work; short bounded waits for runtime control exchanges are different. A stopped provider or agent still needs runtime recovery; a durable record is not a process that can wake itself.

**Cleanup.** Surface blocked agents. Close only panes you created, and never stop the Herdr server.
