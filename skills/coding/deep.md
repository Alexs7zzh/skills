# Independence, the deep run

A deep run uses independent readers to test claims and remedies. It ends with a usable snapshot at its deadline; only an explicit exhaustive certificate waits for complete coverage and settled work.

Reasoning is shared in cross-examination, where it is the thing under attack. A fresh attack and a landing review receive the Claim, evidence, Remedy, and diff, but not the argument that produced them. A subagent inside one session is not an independent peer.

Finding and fixing use one pipeline with the stopping policy from SKILL.md. Advancing one Claim never makes an unrelated Claim wait, and Report never implies a landing.

## Rigor by label

Bug and Restructure Claims get cross-examination and probes. Their Remedies carry the proposal slots from review.md or diagnose.md. Hardening and telemetry-quality Claims use the same objects but do not gate an exhaustive certificate unless the user made them release-gating. Nits close in one line.

## The deep workflow

The route, review.md or diagnose.md, supplies the gathering and report shape. Deep adds the following work.

1. **Fan out coverage.** Every changed hunk sits in one sweep scope. The sweeps together cover every applicable object under Enumerate in good-code.md. Every touched lens and diagnosis cluster gets its own pass. Mechanical sweeps, enumeration, and bulk probe output belong to cheap agents. Lens passes, claim verdicts, composition, remedy judgment, and fresh attacks belong to strong models. Dispatch independent work together. At the deadline, record every unreturned pass and the Coverage items it leaves open.
2. **Keep separate objects.** The ledger stores the six objects from findings.md, their links, their revisions, the partition, evidence paths, agent marks, notes, and snapshots. Set `LEDGER=<absolute path to this skill>/scripts/ledger.ts`; every command below written as `ledger` means `"$LEDGER"`, and `"$LEDGER" --help` lists the commands. `init` pins the TypeScript helper and SQL schema under the run directory.
   - A Claim revision contains the factual label, proposition, coverage, trigger, cause, impact, scope, frequency, certainty, evidence, and any settling probe; it never contains Decision or Remedy fields. The peer who did not last edit it agrees, disproves, duplicates, or contests it.
   - A factual dispute gets two cross-edits. If it remains below step 4, name the probe that would settle it. A probe settles only the proposition it exercises.
   - A Decision, Remedy, Landing, and Delivery each has its own revision and reviewer mark. Editing one never clears agreement on its ancestors. Editing an ancestor stales only its linked descendants.
   - Coverage closes against the frozen partition. A gap appears in every snapshot and blocks only an exhaustive certificate.
   - The ledger exposes ready work. Take any item whose dependencies and independence rules you satisfy instead of waiting on another item.
   - A single-session run uses `init --single` and `report`. A clean quick review still needs no ledger.
3. **Verify and compose continuously.** Cross-examine Claims as they arrive. Once related Claims verify, read them together before their Remedies become fixable. Compose Claims that share a user path, invariant, owner, subsystem, or failure boundary. A combined effect becomes a derived Claim and returns to verification. Shared structure, conflict, and ordering become constraints on linked Remedies. Recompute only the connected group whose Claim or Remedy changed.
   - good-change.md defines the sibling sweep and the criterion that makes a connected group stable.
   - Before claim agreement, the fixer may run a red seam test only after a non-author has found the Claim plausible at step 2 or better, ruled out an obvious duplicate, and reviewed the seam. Batch long builds. The red run is step-4 evidence for the behavior it reached; it is the contest probe only when that behavior settles the named Claim. It proves neither root cause nor fix shape by itself.
4. **Review remedies without reopening facts.** A Remedy links one or more stable Claims and carries origin class, fix shape, sites walked, rulings checked, test seam, cost, and risk. Follow good-change.md to decide whether its review precedes implementation or its landing review may serve both purposes.
   - Two remedy cross-edits end the exchange. One independent adjudicator chooses when engineering evidence decides. If the choice turns on an owner value, create the mapped decision package from findings.md. Do not land a default without prior authority.
5. **Land only as far as authorized.** Report stops with Claims and useful draft Remedies. Prepare stops at reviewed, fixable Remedies. Land implements selected Remedies, keeps red and green runs, and sends each Landing to a non-author reviewer. Check in requires the user's approval. Independent work continues while any Claim, Decision, build, or review is blocked.
6. **Run the fresh attack.** In a local deep run, give the current high-impact Claims, linked Remedies, and clean coverage to a fresh strong model. It re-verifies the Claims and attacks assumptions where a blocker could hide. In a two-family run, cold independent reports and cross-examination supply this independence.
7. **Snapshot the run.** At the deadline, render completed work, open coverage, contested Claims with their probes, pending Decisions, Remedy states, Landing states, skipped passes, and evidence paths. This snapshot is a valid report. An exhaustive certificate is a separate output that requires complete coverage, settled connected groups, current independent marks, and every object required by the stopping policy at its terminal state.

## Two families

Two frontier reviewers from different model families work independently, then cross-examine each other's Claims and Remedies. One fixer owns edits and probe batches. The master speaks for the user and presents snapshots. Choose one role and follow only its section.

| You are | Role |
|---|---|
| The user-facing session, and the Herdr preflight below passes | **Master** |
| The user-facing session, and the preflight fails | **Local reviewer.** Say the runtime is unavailable, then run the deep workflow in this session with subagents and own validation yourself. |
| An agent dispatched by a master as a reviewer | **Peer.** Run the route and the Peers section. `ledger status` tells you whether you are the scribe or countersigner. |
| An agent dispatched by a master as the fixer | **Fixer.** Follow Fixer below. You edit the tree and write no verdicts. |

### Master

Never form or merge the reviewers' claims. Read project rulings only when a Decision needs them or when checking a snapshot. Every message to an agent follows the `agent-messaging` skill.

- **Gather.** Produce the route's frozen input and partition without judging it. Run only the standard probes every peer would otherwise request. Create the run ledger with `ledger init --scribe <A|B> --joint <joint report path> --route <review|diagnose> --policy <report|prepare|land|check-in> --names "A=<agent> B=<agent> fixer=<agent> master=<your name>" --clusters "<the partition ids>"`. Both peers receive the same partition.
- **Dispatch a bounded run.** Start two peers and the fixer together. Reports are due forty minutes after dispatch and the snapshot twenty minutes later. A peer at budget records what returned, marks unreturned coverage as gaps, and leaves unresolved Claims with their next probe. The initial reports are cold: the peers do not contact each other before both imports.
- **Route rulings without blocking the run.** Present a Decision package at the user's next read. Record the answer on that Decision. Never turn a default recommendation into authority to land code.
- **Present the deadline snapshot.** Do not wait for `converged:`. Check that the snapshot distinguishes completed objects from gaps and in-progress work, includes both retrospectives, and names the stopping policy. State whether it is a snapshot or an exhaustive certificate. Bounce a malformed snapshot once, then present it with its ready-work list.
- **On approval.** Advance only the Deliveries the user authorized for this run. Check-ins are the user's unless that authority names the fixer. Record each changeset on its Delivery.

### Peers

- Work independently in cold ledgers until `ledger import` moves both reports into the run ledger. Put non-empty `passes:`, `retrospective:`, and `vote:` lines in `<seat>-notes.md`.
- Pull ready work from `ledger status`. For every Claim you did not last edit, agree, disprove, duplicate, correct, or contest it with the settling probe. A Claim edit returns only that Claim and its dependent objects to the queue.
- Compose each stable connected group independently before reading the other seat's composition. Record a combined effect as a derived Claim and remedy interactions as Remedy constraints. Cross-examine both through their own revisions.
- Review Remedies and Landings you did not author as they become ready. A remedy condition edits the Remedy, not its Claims. A landing defect edits the Landing or Remedy it contradicts, then returns that descendant to its owner.
- At the deadline, finish the notes, record open work, and render the snapshot. For an explicit exhaustive certificate, the countersigner signs only when coverage is complete and every required object has current independent marks; the scribe then runs `ledger converge`.
- If the peer or fixer is silent for 30 minutes, tell the master and continue other ready work.

### Scribe only

- Before a snapshot or certificate, read `ledger render` against the route's output slots.
- Author no claim into the report that has no Claim object. Keep evidence and verified-clean detail in referenced files. A correction edits its owning object and invalidates only linked descendants.
- After the report, leave the run directory intact but do not use it as input to a later run. Its report and artifacts are testimony.

### Fixer

- You are the one editor of the tree, temporary probes included, and write no Claims or Remedy verdicts. `ledger status` lists reviewed seams, fixable Remedies, and Landings awaiting changes.
- Build once and run the owning suite, keeping logs in the run directory. Batch early red probes that meet step 3's gate, especially on long C++ builds.
- For an early red probe, read the reviewed seam and exact Claim. Keep the run only if it reaches the shipped path and asserts that Claim's behavior. Report what it proves and the input class it exercised.
- Under Land or Check in, implement a fixable Remedy. Run its regression test red on the unfixed tree and green with the fix, then build and run the owning tests. Record the Landing against the Remedy revision you read. Independent Remedies share a build; Remedies sharing files or invariants share a landing unit.
- Landed changes stay applied until the user approves or drops them. Tagged probes are removed after each run. A changed Claim or Remedy stales only the linked Landing.
- Check in only a Delivery the user's approval names. Never build a target the project's contract excludes without a ruling.

## Herdr runtime

Wiring for a two-family run. Read when you are the master of a deep run or were dispatched into one. The method is above; `herdr <command> --help` answers flags.

**Preflight.** `test "${HERDR_ENV:-}" = 1` and a responding `herdr agent` command. Either failing makes the user-facing session the local reviewer.

**Cast.** Reviewer A is Claude Opus at high effort, ledger seat A, and is the scribe by default; the master may give the scribe role to either peer. Reviewer B is Codex `gpt-5.6-sol` at high effort, ledger seat B. The fixer is Codex `gpt-5.6-sol` at high effort, `LEDGER_ME=fixer`, started with the peers. Each runs the work with its own subagents.

**Layout.** One new tab for the run, named short after the target ("review cs 15944" or "triage 2026-09-02"). One pane per reviewer and one for the fixer, side by side rather than stacked, each named after its agent ("opus-reviewer", "codex-reviewer", "fixer"). Rename your own agent to an addressable name first with `herdr agent rename`, since reviewers message you by that name. Start each with `herdr agent start <name> --kind claude|codex --pane <pane-id>`. Parse ids from JSON responses rather than guessing, and use `--no-focus`.

**Run directory.** The frozen input, ledger, cold ledgers, joint report, seat notes, snapshot, and validation logs live in one fresh directory. Put it under the project's ignored in-project folder when its review doc names one, otherwise under a temporary directory. `init` pins the helper and schema under `<run dir>/bin/`. Past run directories are not inputs, and no agent removes them.

**Dispatch.** Carry only what is unique to this run, and point the agent at this skill by name:

```
Deep <review|diagnosis> of <target>. You are <name>, a peer; read the `coding` skill (`$coding`), then deep.md, and follow the Peers role. Frozen input: <path>. Ledger: `export LEDGER_DIR=<run directory> LEDGER_ME=<A|B>`. Deadline: <time>. Stopping policy: <policy>.
```

```
Fixer for a deep <review|diagnosis> of <target>. You are <name>; read the `coding` skill (`$coding`), then deep.md, and follow the Fixer role. Workspaces: <paths>. Ledger: `export LEDGER_DIR=<run directory> LEDGER_ME=fixer`. Stopping policy: <policy>. Check in nothing without approval.
```

The ledger already holds the scribe seat, agent names, joint report path, partition, and stopping policy. `ledger status` tells each agent its role and ready work. Append constraints the user stated verbatim and invent none.

**Messaging.** `ledger` sends state-change notifications through `herdr agent prompt`. Each names the changed object and the receiver's next command. If delivery fails, the helper prints the message for manual forwarding. A ruling notification does not stop unrelated work.

**Waiting.** Never poll another agent or wait on review work. Query `ledger status`, take ready work, then go idle when none remains. Resume on a notification within this run. A short wait is allowed only for a control exchange.

**States and cleanup.** Agent states are `idle`, `done`, `blocked`, and `unknown`. Surface blocked to the user. Close only panes you created, and never stop the Herdr server.
