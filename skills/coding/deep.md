# The deep run

Two reviewers from different model families, one shared checkout, one database. Read when the user asked for a deep run, when a review or diagnosis touches a risk surface, or when a master dispatched you into a two-family run. Choose your role in the Roles table before reading the steps. A subagent inside one session is not an independent reviewer.

## Rules

- **Nobody marks their own work.** The reviewer who did not write an issue agrees with it or disputes it. The reviewer who did not write a shelved fix reviews its diff. A question is answered by the user and nobody else.
- **Issues, proposed fixes, and shelved fixes are separate rows.** Correcting a proposed fix never reopens the agreed issue. Fixing a diff never reopens the proposed fix. The script enforces it: an edit clears the marks on that row and on the rows built on it, and nothing else.
- **The test comes first.** A shelved fix needs its red log and its green log, and the script refuses one without them. A test that passes before the fix does not test the bug: rewrite it. When no test can reach the bug, that is an architecture issue, and the fix is shelved without a red log only on the user's answer to a question that says so.
- **Argue twice, then stop.** A fact disputed through two back-and-forth edits gets the probe that settles it, run rather than described. A fix shape disputed through two edits becomes a question for the user, with both shapes and a recommendation. A disputed shape is never shelved; move to another issue.
- **Never wait on one row.** `ledger status` lists the work you can do now. When one issue is blocked on a probe, a review, or the user, take another.
- **Two files per shelved fix.** Normally the red log and the green log go in the run directory; the user's explicit no-red architecture exception leaves only the green log. An issue carries file:line and at most one probe output. Nothing else is written there.
- **The script does the talking.** It tells a reviewer when their ready work goes from none to some, tells the other reviewer what awaits them at your handoff, tells the master every question and every time both reviewers have handed off with nothing ready. Each message names the row and the receiver's next command, and every command prints both reviewers' ready-work counts and your next step. Do not repeat any of it in chat.
- **Bug and Restructure issues get every step.** A Hardening or telemetry-quality issue, when fixed, is shelved and reviewed the same way, and otherwise is listed; it never holds up the report. A Nit closes in one line.

## The steps

The route, review.md or diagnose.md, says how to gather the input and what the report contains. Deep adds these steps. Steps 3 to 8 run per issue, across issues in parallel, in whatever order the database offers.

1. **Cover everything.** Every changed hunk sits in exactly one sweep. The sweeps together cover every object under Enumerate in good-code.md; in a diagnosis, every cluster gets its own investigator. Sweeps are mechanical: cheap subagents read every hunk and return file:line plus what they saw. Lenses, verdicts, fixes, and diff reviews are yours. Dispatch sweeps and lens passes together and let their results meet in the database. A sweep that did not return is a coverage gap in the report, never a silent clean.
2. **Find issues cold.** Each reviewer reviews the whole input alone, in its own database (`ledger init --cold`), with no contact with the other, then imports its issues into the shared database. A cold pass is read-only against the shared checkout: record a needed code probe, then run it after both imports under the shared checkout. That import is your first report. From here on, both reviewers pull from the shared database.
3. **Check each other's issues.** For every issue you did not write: agree, disprove it with evidence at certainty step 2 or better, mark it a duplicate, correct it, or contest it by naming the probe that settles it. Yielding without a certainty step is not agreement. After two contesting edits, the reviewer who contested takes the checkout and runs the probe.
4. **Read related issues together.** When two verified issues touch one user path, one invariant, or one owner, ask what holds when both are true. A defense removed here plus its replacement inert there is a regression, not two harmless changes. Write the result as a new issue linked to both; it is checked like any issue. When two fixes overlap, conflict, or must go in an order, note that on both proposed fixes before either is shelved. Re-verify the top issue in code before the report, and list every dropped or downgraded issue with its reason.
5. **Write the proposed fix.** The reviewer who verified an issue usually writes its fix, since the probe that proved the issue is the start of its test. Classify the origin per good-change.md and finish the sibling sweep that origin calls for. Record the shape, the sites walked, the rulings checked, where the test goes, and the cost. An attention-miss fix that changes no interface or ownership, touches no risk surface, and raises no question for the user goes straight to step 6, and the diff review covers it. Every other proposed fix gets the other reviewer's mark first.
6. **Shelve the fix.** Take the checkout (Shared checkout, below). Write the test and run it on the unfixed code; keep the failing log. Apply the fix, build, run the test and the owning tests; keep the passing log. Shelve the fix's files with the issue ids in the shelve comment, remove every tagged probe, release the checkout, and record the shelve and both logs on the row. Fixes that touch the same file share one shelve. Independent fixes may share one build and one test run.
7. **Review the diff.** The other reviewer opens the shelve as a diff in a fresh context that gets the diff, the issue, and where the test goes, and none of the reasoning. Two questions, asked of every hunk: for each call that can fail, what happens on failure and which branch its error state selects; for the test, whether the red run reaches the shipped code. Open both logs. A defect is a condition written on the shelved fix row; the author fixes it and shelves again. An unresolved point is a condition, not open time. Wording, labels, and log layout are never conditions. A clean diff gets the mark.
8. **Ask the user.** An issue whose fix turns on a product stance, or two fix shapes that survived step 5's two edits, becomes a question per findings.md: what happens, when, how often, each option's cost in code and in user effect, and a recommendation. The script tells the master, who shows it to the user at once. That issue waits; you move to another. The user's answer, recorded on the question, goes to the reviewer who asked, and the issue is ready work again.
9. **Report.** When your ready work is empty, release the checkout and run `ledger handoff`; it tells the other reviewer what awaits them. When both reviewers have handed off and neither has ready work, the script tells the master, who prints the report with `ledger report`. An answered question restarts the loop, and the master prints the report again when it ends. The report lists every issue with its label, certainty step, marks, fix state, and shelve; every open question; every coverage gap; and both reviewers' notes. Each has a `passes:` line of the form `passes: N sweeps, N lenses, N probes, N diff reviews`; when a count is zero, a separate `skipped:` line names that pass and why it did not run. An open item is printed as open. The marks on each row are the double check.
10. **Check in.** Only on the user's word, and only the shelved fixes it names. Record each changeset on its row. A shelved fix the user does not name stays shelved.

In a two-family run, step 3 is the fresh attack. A run with one session sends the verified issues, their evidence, the assumed issues, and the clean coverage to a fresh subagent that re-verifies them without seeing your reasoning, looking wherever a blocker could hide.

## Shared checkout

One checkout, many writers, one at a time. Before any edit, probe or fix, take the checkout in the database. Release it when the tree holds no probe and every shelve is recorded. `ledger status` shows who holds it and for what; held means do other work. The first holder builds once and runs the owning suite, logs in the run directory, so every later failure has a baseline. Shelved fixes stay applied in the checkout until the user checks them in or drops them. Probes never survive a release. When builds are long, batch several fixes under one hold. Never build a target the project's contract excludes without asking the user.

## Roles

| You are | Role |
|---|---|
| The user-facing session, and the Herdr preflight below passes | **Master** |
| The user-facing session, and the preflight fails | **Local reviewer.** Say the runtime is unavailable, then run the steps in this session with subagents: a fresh subagent for the fresh attack and for every diff review. Never imitate a two-family exchange without the runtime. |
| An agent a master dispatched | **Reviewer.** Run the route and the steps above. `ledger status` names your seat. |

### Master

You speak for the user and touch nothing else. Never judge an issue, merge findings, or relay reviewer traffic. Every message you write to an agent follows the `agent-messaging` skill.

- **Gather.** Run the route's gathering steps, the ones that produce the input without judging it: the changeset inventory for a review; the export, grouping, and cluster list for a telemetry triage. Run the standard probes any reviewer would ask for and put their results in the frozen input. Read how the project makes a shelve from its doc; if the doc is silent, ask the user once and suggest recording the answer there. Freeze the input in the run directory and create the database there with `ledger init`, naming both reviewers and yourself. Send each named agent one test prompt first.
- **Dispatch** both reviewers per the Herdr section. Tell the user in one line that questions will appear here as they come, that status is available on request, and that the report comes when both reviewers are done. Then go idle.
- **Route questions.** A `question:` message from the script is for the user. Print it at once, with every other open question, so the user finds them all on return. Record the user's answer on the question row. Never answer one yourself and never reword one.
- **Answer "how is it going".** Print `ledger status` in the user's words: issues by state, who is working on what, who holds the checkout, the open questions, and each agent's state from `herdr agent list`. A `blocked` agent is the first line.
- **Present the report** when the script says both reviewers are done, or when the user asks. Print it with `ledger report`. Then stop. The user may check in, drop, answer, or ask for more.
- **On the user's go**, record it on the named shelved fixes. Check-ins are the user's unless the go names a reviewer to do them. Record each changeset on its row.

### Reviewer

- Cold pass first, in your own database, then `ledger import`. Write `passes:` and `retrospective:` lines in `<seat>-notes.md` in the run directory; for a review, add Goal closure and Domain scenarios per review.md.
- Then pull from `ledger status` until it is empty: issues to check, proposed fixes to mark, shelved fixes to review, conditions on your own shelved fixes, verified issues to fix. Fan out with subagents per group of related issues, each returning a verdict with evidence. Keep going in the same turn while your ready work is not empty, whatever messages went out meanwhile; if the other reviewer's issues are already in when yours import, start checking them at once.
- A verified issue nobody is fixing is yours to take, whoever wrote it.
- When your ready work is empty, release the checkout, run `ledger handoff`, and end your turn. Replies arrive as prompts. A pass that ends without handoff leaves the other reviewer and the master waiting for a message that never comes.

## Herdr runtime

Wiring for a two-family run. Read when you are the master of a deep run or were dispatched into one. The method is above; `herdr <command> --help` answers flags.

**Preflight.** `test "${HERDR_ENV:-}" = 1` and a responding `herdr agent` command. Either failing makes the user-facing session the local reviewer.

**Cast.** Reviewer A is Claude Opus at high effort, database seat A. Reviewer B is Codex `gpt-5.6-sol` at high effort, seat B. Each runs the work with its own subagents, and both write fixes through the shared checkout.

**Layout.** One new tab for the run, named short after the target ("review cs 15944" or "triage 2026-09-02"). One pane per reviewer, side by side, each named after its agent ("opus-reviewer", "codex-reviewer"). Rename your own agent to an addressable name first with `herdr agent rename`, since reviewers message you by that name. Start each with `herdr agent start <name> --kind claude|codex --pane <pane-id>`. Parse ids from JSON responses rather than guessing, and use `--no-focus`.

**Run directory.** The frozen input, the database and both cold databases, the reviewers' notes, the red and green logs, and the printed report live in one fresh directory. Put it under the project's ignored in-project folder when its review doc names one, otherwise under a temporary directory. `ledger init` pins the script and its schema under `<run dir>/bin/`; run every later `ledger ...` spelling in this document as `"$LEDGER_DIR/bin/ledger.ts" ...`. A past run's directory is not an input: its report is testimony, and no agent removes it.

**Dispatch.** Carry only what is unique to this run, and point the agent at this skill by name:

```
Deep <review|diagnosis> of <target>. You are <name>, a reviewer; read the `coding` skill (`$coding`), then deep.md, and follow the Reviewer role. Frozen input: <path>. Checkout: <path>. Database: `export LEDGER_DIR=<run directory> LEDGER_ME=<A|B>`; helper: `"$LEDGER_DIR/bin/ledger.ts"`. How far: <fix|report-only|check-in>.
```

The database already holds the agent names, the how-far setting, and the coverage partition. `ledger status` tells each agent its seat and ready work. Append constraints the user stated verbatim and invent none.

**Messaging.** The script sends every message through `herdr agent prompt` to the names recorded at init. To a reviewer: your ready work went from none to some, naming the rows; the other reviewer handed off, naming what awaits you; the user answered your question. To the master: a question, and both reviewers done. Each names the receiver's next command. If delivery fails, the script prints the message: send it yourself.

**Waiting.** Never poll another agent or wait on review work: no `--wait` on a reviewer, no pane peeking, no progress narration. Work until your ready work is empty, hand off, go idle, and resume on a message. A short `--wait` with a tight timeout is fine for a control exchange.

**States and cleanup.** Agent states are `idle`, `done`, `blocked`, and `unknown`. Surface blocked to the user. Close only panes you created, and never stop the Herdr server.
