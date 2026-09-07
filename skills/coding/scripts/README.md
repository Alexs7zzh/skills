# Coding work record

Node 22.18 or newer. Run `node --no-warnings ledger.ts --help` for the command surface. No runtime dependencies; TypeScript and fast-check are development tools.

## Boundary

The helper retains explicit commitments, immutable record versions, checkout ownership and child execution facts. It does not encode finding labels or a mandatory verify/propose/review itinerary. A task is an independently assignable outcome, not every phase of thought. Engineering judgment stays in the skill documents and retained assessments.

- `protocol.ts`: pure atomic commands over facts; optimistic revisions.
- `work.ts`: shared start/finish eligibility, declared-input currentness, responsibility signals.
- `store.ts`: SQLite transactions, event history and monotonic work-change versions.
- `cli.ts`: arguments, content-addressed file retention, pinned helper setup.
- `report.ts`: read-only views; never declares the engineering correct.
- `coordinator.ts`: optional Herdr transport, exact runtime identity and delivery inspection.

Task revision changes for any edit. Material version changes only when the promised result changes; dependencies pin that version. Assignment, checkout hold, artifact authorship and child parent are separate facts. A finished child is not a finished task. A completed review task can deliver conditions or a historical assessment.

## Local use

Initialize with the goal and source of scope authority. Local work defaults to the sole actor master. Multi-agent runs supply actor-to-runtime names at initialization. The helper pins itself in the run's bin directory; resume with that copy.

Create one task for the first substantive outcome. Save records as needed, not one task per finding phase. A file-backed finish retains the bytes, saves a result manifest and finishes the task in one database transaction. Refused transactions may leave an unreferenced retained artifact, but never a partial task/result update. Use exact record versions for material inputs and explicit task dependencies for awaited results. An unanswered user decision becomes a user wait on affected work; resolving it requires a master-recorded ruling reference and incorporates that input atomically. Ledger.md owns the recorder's materiality and dependency obligations.

Status shows open commitments and blockers. Report is available at any time and keeps historical evidence visible. Notes and ownership transfers do not pretend work is complete. Ordinary argument or stale-revision errors need a reread and correction, not a coordination emergency.

## Runtime

Domain commands never call Herdr. Only the optional coordinator does. It wakes idle responsible actors, lets busy actors pull between tasks, and retains ambiguous delivery without automatic resend. Binding requires the expected runtime identity; a reused name is not sufficient.

The watch loop checks finite child inspection times and idle work. One minute without observed activity after an accepted wake is an inspection checkpoint that asks master to look, not a claim the agent died or a deadline for completing the work. Pausing drains an in-flight send. Restart/retry requires reconciliation of retained uncertainty. No transport status counts as a delivered engineering result.

## Compatibility and checks

Schema 10 is a replacement protocol, not a silent migration. Older runs retain their own pinned helpers and evidence. Do not point this helper at an old ledger or invent task ownership during import. A deliberate continuation needs an explicit task/evidence mapping with unresolved decisions preserved.

Run `npm run check` here and `scripts/check-skills.sh` from the repository root. Tests cover pure transitions, changing inputs/scope/ownership during work, atomic retained results, actual CLI use, and fake-runtime delivery/inspection. Fake runtime checks do not certify a real Herdr installation or production project workflow.
