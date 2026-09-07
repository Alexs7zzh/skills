# The coding ledger

`ledger.ts` is the run database the coding skill's docs name. It holds state,
gates, messages, and the record: the rows of a run, the rules that refuse a
forbidden state, the messages that tell an agent when work is ready, and every
command as it landed, with what each agent was doing or waiting on at that
moment. Every rule it enforces restates a sentence in the skill's Markdown;
everything else is a plain instruction there. `ledger --help` lists the commands.

Node 22.18 or newer runs the TypeScript directly. There is no build step and no
runtime dependency.

Commands reject unsupported or conflicting inputs instead of silently dropping
them. Joint-run names identify three distinct, nonempty agent addresses, so a
reviewer or question notification cannot be routed back to another role in the
same session.

```sh
cd skills/coding/scripts
npm install          # dev dependencies only: typescript, fast-check, @types/node
npm run check        # typecheck, then the tests
```

## Shape

- `src/protocol.ts`: the rules as a pure function, `transition(state, command)`,
  plus `ready(state, actor)`, which lists what each actor can do now,
  `situation(state, actor)`, what an actor is doing or waiting on, and the
  messages a two-reviewer run sends.
- `src/store.ts`: SQLite as the durable envelope and the write lock. One row
  holds the state as JSON; one append-only table holds the record: each event
  with a millisecond timestamp, the substance of what was said, and every
  actor's situation once it had landed. Notification intent commits in the
  same transaction; a delivery table retains each recipient, message, and
  outcome history separately from domain state.
- `src/cli.ts`: argument parsing, log-file checks, notes checks, message delivery.
- `src/report.ts`: status, report, and timeline rendering.

## Notification outcomes

Joint-ledger mutations commit before sending runtime notifications. Exit status
`2` means the mutation was saved but at least one delivery was not confirmed;
it is not a refused mutation to retry. The output identifies each recipient,
the subprocess error and its diagnostic output, and the message needing attention.
Subprocess diagnostics are retained under `<run>/delivery/`. Notification intent
is already in the database, so process loss after the mutation leaves a pending
or unconfirmed delivery visible in status and the report.

`delivery show D-id` reads its recipient, saved body, revision, and outcome history.
After checking the recipient/runtime, use `delivery retry D-id rev=N checked=...`
to retry that notification, or `delivery accept D-id rev=N checked=...` to record
evidence that it was accepted. Use `delivery supersede D-id rev=N reason=...`
when the work no longer needs that notice. The sender, its recorded successor
(the arranger for a fresh reader), or master can reconcile it. Settled notices
cannot be retried. There is no automatic retry or exactly-once delivery guarantee;
acceptance may precede an interruption. Runtime access, recovery ownership, and
task-specific stop rules follow `../deep.md`, Herdr runtime.

The default notifier is `herdr agent prompt`. `LEDGER_NOTIFY=print` (or an empty
value) deliberately prints messages without sending them and exits successfully;
the output labels that mode. Successful notifier commands are reported as accepted.
Read-only commands and single-seat runs need no notification transport.

## Reading a run back

The database is the run's shared sequence of recorded commands. `ledger timeline`
derives intervals from the state after each event; `timeline A|B|master` narrows
to one agent and `timeline <row-id>` prints the argument on one row, including
its cold-pass history. Situations are inferred: `working` means work is ready,
not that execution was observed. A checkout hold records ownership; a candidate
waiting on another hold is waiting on the checkout. The timeline cannot measure
unrecorded reasoning, actual execution time, or whether a released checkout was
cleaned up.

`ledger init` copies `ledger.ts` and `src/` into `<run>/bin/`. Later commands run
the pinned copy, so a skill update cannot change a live run's rules. A database
written by another schema version is refused, never migrated. Continue with its
pinned copy where it supports the required transition. If an older helper cannot
continue the authorized work, follow findings.md, Related work and continuity:
start a compatible record linked to the preserved artifacts without repeating
the investigation.

## Candidate continuity

An investigator can take a new or contested issue and develop its proposal and
candidate before agreement. A proposal can name a feature goal without an issue.
Proposal marks and rejections support discussion and report-only review; they
never gate candidate development or turn repeated disagreement into a user decision.
A clean independent candidate review also marks the supported current claims and
proposal. A reviewer cannot mark a claim revision they wrote.

For cooperative takeover, follow `../ledger.md`, Cooperative handoff.
`proposed-fix release` and `proposed-fix take` transfer ownership of the proposal
and any other proposals bundled in its saved candidate. Issue takes alone do not
transfer proposals. The owner releases the checkout first; no other seat can
release its work. Ownership changes preserve row IDs, content revisions, retained
evidence and reviews. Material edits retain all contributors and invalidate the
affected reviews as usual. Dependencies keep their own owners.

Joint-run candidates are reviewed by a fresh non-author context, never a
continuing A/B session. It uses `LEDGER_ME=reader` with `reader=<context name>` and
`assessment=<file>` on a review command. This identity can only agree with an
issue, mark or reject a proposal, or review a candidate. Its name and a
content-addressed copy of its assessment stay in the record. The helper refuses
the existing writer names; the caller still must dispatch an actual fresh context.
Status and notifications name the one arranger per `../ledger.md`, Fresh reviews.
The arranger's notes retain the child lifecycle; a pending assessment in status
does not mean no child has been launched. Single-seat runs keep A as the arranger
and B as their fresh reader.

Each candidate names its saved artifact, exact baseline, dependency candidates
as `S-A-1@2`, and a validation file following findings.md, Evidence. The script
retains a content-addressed copy of that record under the run's `validation/`
directory. A refreshed candidate needs refreshed validation content, including
what was rerun and what still applies. The digest detects unchanged content;
the reviewer judges whether the record actually supports the candidate. Code
proof at certainty 3 is valid issue evidence. Red/green runs are one evidence
method, not required fields for every candidate. `checkout baseline` remains
available when a build and suite baseline are relevant; it is not a required step.

Only material candidate updates advance its revision; review records do not.
`review-basis <I|P|S-id>` identifies the recorded inputs for an assessment. Capture
it with the reader's input and supply `basis=<token>` on issue agreement, proposal
mark/rejection, or candidate review. The helper rejects an obsolete basis even
when the candidate revision is unchanged. A new basis needs reassessment of the
changed inputs, not a new validation run solely to satisfy the helper; see
findings.md, Continuity.
Changing a claim or proposal, or answering a linked question, clears affected
reviews downstream without forcing new validation content. Reviewed candidates
return to `shelved`; outstanding conditions and already-stale validation remain.
Changing a candidate revision or dropping a dependency makes dependent validation
`stale` until refreshed. Unrelated candidates keep their reviews.
Check-in authorization captures the selected revisions and requires
each dependency either in that selection or already checked in at that revision.

When an observation or ruling resolves conditions without changing candidate inputs
or invalidating evidence, the owner can use `shelved-fix request-review <S-id>
rev=N reason=...`. This returns the candidate to `shelved` and notifies its reader
through the ready queue, preserving its revision, validation, and conditions.
An independent reader can also use `shelved-fix review` directly from `conditions`
to replace or clear them. Conditions alone do not queue repeated peer reviews;
their history remains in the timeline after resolution. Actual candidate changes
still use `shelved-fix set` with refreshed validation.

Use `run set` when the user changes how far to go, such as moving a report-only
investigation into implementation. Existing rows, evidence, and history remain.
The command's reason records the user's instruction. An open question blocks
its named issues or proposal and work that depends on them.

`proposed-fix drop` records the user's decision to abandon a proposal and its
candidate before any check-in approval. It retains the artifacts, withdraws open
questions tied to that proposal, and invalidates dependent reviews. An engineering
rejection remains discussion; it is not a user-authorized drop.

## Adding or removing a rule

Change the concept in the skill's Markdown first. Then make `protocol.ts` refuse
the state the concept forbids, in the doc's own words, and add the case to
`test/protocol.test.ts`. A rule that no sentence in the docs asks for does not
belong here.
