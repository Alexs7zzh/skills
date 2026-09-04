# The coding ledger

`ledger.ts` is the run database the coding skill's docs name. It holds state,
gates, and messages: the rows of a run, the rules that refuse a forbidden state,
and the messages that tell an agent when work is ready. Every rule it enforces
restates a sentence in the skill's Markdown; everything else is a plain
instruction there. `ledger --help` lists the commands.

Node 22.18 or newer runs the TypeScript directly. There is no build step and no
runtime dependency.

```sh
cd skills/coding/scripts
npm install          # dev dependencies only: typescript, fast-check, @types/node
npm run check        # typecheck, then the tests
```

## Shape

- `src/protocol.ts`: the rules as a pure function, `transition(state, command)`,
  plus `ready(state, actor)`, which lists what each actor can do now, and the
  messages a two-reviewer run sends.
- `src/store.ts`: SQLite as the durable envelope and the write lock. One row
  holds the state as JSON; one table holds the timeline.
- `src/cli.ts`: argument parsing, log-file checks, notes checks, message delivery.
- `src/report.ts`: status and report rendering.

`ledger init` copies `ledger.ts` and `src/` into `<run>/bin/`. Later commands run
the pinned copy, so a skill update cannot change a live run's rules. A database
written by another schema version is refused, never migrated: finish that run
with its pinned copy.

## Adding or removing a rule

Change the concept in the skill's Markdown first. Then make `protocol.ts` refuse
the state the concept forbids, in the doc's own words, and add the case to
`test/protocol.test.ts`. A rule that no sentence in the docs asks for does not
belong here.
