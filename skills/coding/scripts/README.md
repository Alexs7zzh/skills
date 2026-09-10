# Coding helpers

Node 22.18 or newer. No runtime dependencies; TypeScript and fast-check are development tools. Run either helper with `node --no-warnings <helper>.ts --help` for its current commands and flags.

## Ledger

Use `ledger.ts` only for joint investigation. [../joint.md](../joint.md) owns the workflow and runtime controls; [../ledger.md](../ledger.md) owns recording and checkout mechanics. Initialize with both investigators and master, then use the helper pinned in the run's `bin` directory. Set `LEDGER_DIR` to that run and `LEDGER_ME` to your actor. Single-actor initialization supports local helper fixtures, not a coding workflow level.

Mutations return compact receipts. `status ID` shows nested replacements and cached runtime observations without contacting the runtime; `report` and `timeline` expose retained work and changes. `dispatch show ID` recovers a child's recorded identity without contacting its runtime. Only the optional coordinator invokes Herdr; domain commands never send messages or execute project work.

The modules under `src/` divide implementation responsibilities:

- `protocol.ts`: atomic decisions, optimistic revisions, conclusions and replacement-cycle guards.
- `work.ts`: action eligibility, missing assent and unread master attention.
- `store.ts`: SQLite transactions, event history and work-change versions.
- `cli.ts`: arguments, retained files and helper pinning.
- `report.ts`: nested issue views and retained arguments.
- `coordinator.ts`: Herdr transport, runtime identities and delivery inspection.

## Execution evidence

`evidence.ts` is a standalone capture runner for retained investigation evidence, not a required step in normal coding. It creates a new directory for one literal command invocation, retains selected input files and raw output, and writes its termination receipt after the child and output streams close. `run` verifies the fresh capture and returns `{ directory, start, receipt, stdout, stderr }`; read the supporting output paths before interpreting it. `inspect` returns the same envelope for a closed capture and checks retained bytes without executing anything. Use it for reuse or recovery, not as an obligatory second call after a successful `run` handoff.

Verification compares retained files with the invocation bytes saved before launch and the output bytes captured from the process streams. The capture records process facts, not test verdicts, provenance authentication or what an agent had observed before writing a claim. Use [../evidence.md](../evidence.md) to choose and interpret evidence, and [../maintaining.md](../maintaining.md) to assess chronological claims in a trial. Normal command permissions and shared-input ownership still apply.

## Checks

Run `npm run check` here and `scripts/check-skills.sh` from the repository root. Tests cover conclusions, replacements, responsibility, scope and ownership, retained-result rollback, actual CLI use and fake-runtime delivery/inspection. They do not certify a real Herdr installation or production project run.

For timing audits, `insights [from=<ISO>] [until=<ISO>] [format=markdown|json]` reads the ledger and optional coordinator audit without changing either. Use a cutoff to exclude later user waits. Runtime working/idle, checkout requests and declared activities are separate overlapping clocks. `activity start ID phase=... [task=ID]` / `activity stop ID` optionally retain declared boundaries as ordinary activity records; they neither schedule work nor grant assent. Unrecorded self-review time remains unknown.
