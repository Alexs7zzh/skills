# Coding work record

Node 22.18 or newer. Run `node --no-warnings ledger.ts --help` for commands. No runtime dependencies; TypeScript and fast-check are development tools.

## Boundary

Two equal investigators retain evidence, publish conclusions and examine each other's arguments. Either can investigate, implement, ask questions or challenge a conclusion. A task is a continuing issue or question, not a compulsory stage of thought. An action owner avoids conflicting execution; it does not own the right to reason about that issue.

Publishing endorses the author's argument. The peer agrees against the current task revision. Republishing clears peer assent; saving evidence or editing a note does not. The helper retains exact argument versions but does not infer which conclusions new evidence semantically changes. Investigators explicitly republish or reopen those conclusions.

A replacement links one issue to one or more continuing issues. Shared children are allowed; cycles are refused. The explanation of duplicates, exclusions or decomposition is ordinary language in the argument, not a machine-checked proof. Terminal children do not imply their parent was successfully fixed.

- `protocol.ts`: atomic decisions, optimistic revisions, conclusions and replacement-cycle guards.
- `work.ts`: action eligibility, missing peer assent and unread master attention.
- `store.ts`: SQLite transactions, event history and monotonic work-change versions.
- `cli.ts`: arguments, content-addressed file retention and pinned helper setup.
- `report.ts`: nested issue views and retained arguments; no engineering truth inference.
- `coordinator.ts`: optional Herdr transport, exact runtime identity and delivery inspection.

## Local use

Initialize with the goal and source of scope authority. Local work defaults to the sole investigator master; a joint run supplies both peer names and master. The helper pins itself in the run's `bin` directory. Resume using that copy.

Create issues as the investigation develops. Save records as needed. `task publish` takes an exact result record or retains a file and publishes it atomically. Refused transactions may leave an unreferenced retained artifact, but never a partial record/task update. `task agree` records peer assent. `task reopen` resumes investigation; `task publish` can also replace a previous conclusion directly. See `../ledger.md` for the full contract.

An unanswered decision is a user wait on affected work. Clearing it requires a current master-recorded ruling and atomically links that ruling to the task. Other affected conclusions are the investigators' responsibility to reconcile. External waits likewise retain their reason; neither wait is successful completion.

`status ID` displays a nested replacement view with shared references. `report` keeps all arguments and waits visible. Master reads meaningful changes, summarizes them and uses `task ack` to acknowledge visibility, never to supply peer assent. Finishing the run means every registered conclusion has investigator agreement and no checkout or child execution remains held; it does not mean every requested fix succeeded.

`dispatch show ID` returns the exact execution identity and revision without a runtime call or mutation. A finished child is not a finished issue and cannot substitute for a peer's assent. Argument and stale-revision errors call for a reread and correction, not a coordination emergency.

## Runtime

Domain commands never call Herdr. Only the optional coordinator does. It wakes idle responsible actors, lets busy actors pull between tasks, and retains ambiguous delivery without automatic resend. Binding requires the expected runtime identity; a reused name is insufficient. Unassigned action work wakes master, not an implicitly selected idle worker.

The watch loop checks finite child inspection times and idle work. One minute without observed activity after an accepted wake is an inspection checkpoint for master, not proof the agent died or a work deadline. Pausing drains an in-flight send. Unconfirmed delivery pauses sends and exits the watcher visibly; this local failure is not a confirmed master notification. Restart/retry requires reconciliation of retained uncertainty. Transport acceptance is not engineering completion.

## Compatibility and checks

Schema 11 deliberately replaces schema 10, not silently migrates it. Old runs retain their pinned helpers and evidence. Do not point this helper at an old ledger. An authorized continuation needs an explicit mapping of continuing issues, arguments and ownership, preserving unresolved rulings; do not invent peer assent during import.

Run `npm run check` here and `scripts/check-skills.sh` from the repository root. Tests cover conclusions, replacements, responsibility, changing scope and ownership, retained-result rollback, actual CLI use and fake-runtime delivery/inspection. These checks do not certify a real Herdr installation or production project run.
