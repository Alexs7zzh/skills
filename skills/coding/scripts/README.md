# Coding ledger implementation

The coding ledger is a bundled TypeScript command-line program for review and
diagnosis runs. Its protocol is a typed reducer: commands produce validated state
transitions, and SQLite stores the current state plus an append-only transition
journal. Effect v4 supplies the CLI and SQLite services. `fast-check` exercises
the reducer independently of the command line and database.

Build the self-contained executable with Node.js 22.16 or newer:

```sh
cd skills/coding/scripts
npm install
npm run build
```

The build writes executable `ledger.mjs`. A new run copies that bundle under
`<run>/bin`; all later commands use the pinned copy so an installed skill update
cannot change a live run's protocol.

Treat `LEDGER_DIR` as trusted executable state. Its manifest hashes detect a
changed pin; they do not authenticate a run directory supplied by someone else.

The CLI is organized around the protocol's work objects: coverage, issue,
question, proposed fix, shelved fix, and check-in. It also manages issue takes,
the single workspace checkout, handoffs, status, reporting, and per-agent
timelines. Run `./ledger.mjs --help` for the authoritative command grammar.

Run the complete implementation checks with:

```sh
npm run check
```

The TypeScript bundle is the only supported implementation. It refuses an
incompatible database instead of guessing at a migration.
