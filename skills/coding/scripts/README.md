# The coding ledger

`ledger.ts` is the run database the coding skill's docs name. It holds state,
gates, messages, and the record: the rows of a run, the rules that refuse a
forbidden state, the messages that tell an agent when work is ready, and every
command as it landed, with what each agent was doing or waiting on at that
moment. Every rule it enforces restates a sentence in the skill's Markdown;
everything else is a plain instruction there. `ledger --help` lists the commands.

Node 22.18 or newer runs the TypeScript directly. There is no build step and no
runtime dependency.

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
  actor's situation once it had landed. A command writes one short row there
  and reads nothing back.
- `src/cli.ts`: argument parsing, log-file checks, notes checks, message delivery.
- `src/report.ts`: status, report, and timeline rendering.

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
Changing a claim or proposal, or answering a linked question, clears affected
reviews downstream without forcing new validation content. Reviewed candidates
return to `shelved`; outstanding conditions and already-stale validation remain.
Changing a candidate revision or dropping a dependency makes dependent validation
`stale` until refreshed. Unrelated candidates keep their reviews.
Check-in authorization captures the selected revisions and requires
each dependency either in that selection or already checked in at that revision.

Use `run set` when the user changes how far to go, such as moving a report-only
investigation into implementation. Existing rows, evidence, and history remain.
The command's reason records the user's instruction. An open question blocks
only its named issues or proposal.

`proposed-fix drop` records the user's decision to abandon a proposal and its
candidate before any check-in approval. It retains the artifacts, withdraws open
questions tied to that proposal, and invalidates dependent reviews. An engineering
rejection remains discussion; it is not a user-authorized drop.

## Adding or removing a rule

Change the concept in the skill's Markdown first. Then make `protocol.ts` refuse
the state the concept forbids, in the doc's own words, and add the case to
`test/protocol.test.ts`. A rule that no sentence in the docs asks for does not
belong here.
