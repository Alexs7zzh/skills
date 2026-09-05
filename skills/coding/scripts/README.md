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

The database is the run's only time-aligned record. `ledger timeline` derives
from it where the time went per agent, what each agent was doing or waiting on
at each moment, and every event; `timeline A|B|master` narrows to one agent
and `timeline <row-id>` prints the argument on one row, from the cold pass that
created it onward. Situations come from the state alone: an agent with ready
work is working, a holder of the checkout holds it, an agent whose approved fix
waits on another's hold is waiting on the checkout, a handed-off agent is idle
or waiting on the user, and an agent with nothing ready that has not handed off
is shown as exactly that. The session logs are not the record.

`ledger init` copies `ledger.ts` and `src/` into `<run>/bin/`. Later commands run
the pinned copy, so a skill update cannot change a live run's rules. A database
written by another schema version is refused, never migrated: finish that run
with its pinned copy.

## Adding or removing a rule

Change the concept in the skill's Markdown first. Then make `protocol.ts` refuse
the state the concept forbids, in the doc's own words, and add the case to
`test/protocol.test.ts`. A rule that no sentence in the docs asks for does not
belong here.
