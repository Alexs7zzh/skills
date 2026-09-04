# Ledger implementation

`ledger.ts` is the executable deep-run ledger. It requires Node.js 22.18 or newer, uses Node's built-in SQLite driver, and has no installed dependencies. Start a run with the source copy; `init` pins `ledger.ts`, `ledger.sql`, and a compatibility launcher under `<run>/bin`. Use the pinned copy for the rest of a live run.

```sh
export LEDGER=/absolute/path/to/coding/scripts/ledger.ts
export LEDGER_DIR=/path/to/run LEDGER_ME=master
"$LEDGER" --help
```

The schema remains explicit SQL. SQLite constraints and triggers protect immutable revisions and legal state transitions; TypeScript owns the command grammar, role checks, dependency checks, atomic signing, pinning, rendering, and notifications. Public mutations share the retained helper's run-directory lock as well as SQLite transactions. The root `ledger.sh` and `ledger.sql` remain together as the schema-v8 reference and entry point for already-pinned old runs. New runs do not migrate old ledgers automatically.

Effect v4 RC and Drizzle were evaluated for this port. Neither is used. Effect's service and error channels would help a larger asynchronous application, but this helper is a synchronous, single-file command pinned into arbitrary run directories. Adopting Effect would require distributing a package tree or generated bundle, and the v4 CLI and SQL modules are still under `effect/unstable`. Drizzle would obscure the trigger-heavy state constraints without replacing them. Reconsider either only if this workspace adopts a build and dependency-distribution contract.

Run the focused implementation checks with:

```sh
node --no-warnings --test skills/coding/scripts/ledger.test.ts
```
