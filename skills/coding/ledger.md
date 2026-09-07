# Ledger runtime

Read when starting or resuming a substantive work record, or editing a checkout shared by agents. findings.md owns what to record and when; this file owns setup and checkout mechanics. Deep coordination and the two-family runtime stay in deep.md.

## Run directory and setup

Use findings.md, Working record, to decide what to retain. For substantive writing, quick review, plain diagnosis, or local deep work, initialize a single-seat record at the start unless continuing an existing run. Use the route `write`, `review`, or `diagnose`; add `--deep` for a local deep run. Seat A investigates and writes. A fresh reader uses seat B to record its own check; do not switch identities to mark your own work.

Keep the record in the project's ignored working folder when one is specified, otherwise in a fresh temporary directory retained through the task. The directory holds the frozen input, database, evidence, candidate patches when needed, reviewer notes, and reports. Save the revision and existing local changes that define the input, rather than relying on a branch name.

Set `LEDGER_DIR` to that directory and `LEDGER_ME` to your seat. Run the skill's `scripts/ledger.ts --help` to see initialization and record commands. `ledger init` pins the helper under `<run directory>/bin/`; all later commands in this document refer to that pinned `bin/ledger.ts`. Existing runs keep their pinned helper when the skill changes. Continue or reuse their evidence per findings.md, Continuity; do not delete an old run as setup for a new one.

In a joint run, `init --cold` inherits the master's declared scope and settings. The same pinned commands automatically read and write your private cold database until import; no database-selection flag is needed. Independent discovery delays sharing, not recording: follow findings.md, Working record, in your cold pass too. If the supplied scope is missing from the record, add its coverage rows before investigating it.

Use `<seat>-notes.md` for the current note described in findings.md, Working record. Full artifacts stay on disk; there is no fixed number of files per issue or candidate. Before reporting or handing off, the pinned helper names any missing report fields. A pass count describes work already done, not a reason to run another pass. Reports summarize the record so the user can see outcomes and choices without reading the whole investigation.

## Cooperative handoff

An issue take reserves investigation; it does not transfer an existing proposal. To hand off a proposal, save its current candidate and evidence, release the checkout, then release the proposal. Its successor takes the released proposal and resumes its retained work. When that successor can take the work, the release removes pickup from the donor's ready work: the donor can hand off without waiting for the take. Other ready obligations still apply. The donor may explicitly take the work back; if only the donor can take it, pickup remains its ready work. The helper transfers proposals bundled in one candidate together, including their issue takes. Only the owner releases work; taking it cannot preempt an owner or another investigator's issue take. The pinned helper's help supplies the commands.

Ownership controls edits; authorship and contributors stay recorded. A handoff changes no content revision, evidence, or applicable review. A contributor cannot mark their retained work after ownership changes. Use Fresh reviews below when an assessment needs a new context, including when both seats contributed.

## Fresh reviews

The helper names one arranger for each pending fresh assessment. In a joint run it is the seat other than the editor of the candidate revision being reviewed, not whichever seat owns the proposal now. The same rule applies to a report-only proposal that both seats contributed to. Ownership-only handoff does not change the arranger. In a single-seat run, A arranges the fresh B context.

Only the named arranger starts that reader. Retain the child context identifier, exact assessment target and review basis, and whether it is running, completed, or stopped in the arranger's working note. On resumption, use that record before starting another reader. The helper lists assessments still needed, not whether a child is already running. If inputs change while the child runs, carry the changed basis and inputs to that child for reassessment; a changed basis is not a request for a duplicate reader. If a child fails or stops, preserve its partial work and state before replacing it; do not run two readers for the same pending assessment. Continue unrelated ready work while a child runs, then hand off and resume on its result.

Joint-run candidate reviews and the fresh report-only proposal assessments above use `LEDGER_ME=reader`, even when only one seat wrote the candidate. This review-only identity records its own name and retained assessment file. Continuing A/B sessions can investigate and discuss issues and proposals, but cannot substitute for fresh candidate review. Single-seat readers use B. Authors must not switch identities to mark their work. The reader follows good-change.md, Review the result, and findings.md, Continuity, for follow-up checks.

## Shared checkout

One writer holds the shared checkout at a time. Before any shared edit, take it in the database. State what you are changing; a holder finishes and records its current batch before releasing. Others take work that does not depend on reading a moving tree.

Establish and retain the relevant build and test baseline before attributing later failures to a candidate. Hold the checkout while a build or test consumes its inputs, or run against an immutable copy. Readers judge a saved candidate and its baseline, never an unidentified mixture of another agent's edits.

When a batch is ready, record every candidate and its validation, remove temporary instrumentation per SKILL.md, and release the checkout. Candidates can stay applied; their saved artifacts must remain separately recoverable. Batch builds when it reduces repeated work, naming the candidate combination tested. File overlap alone does not require one shelve; dependency and selection rules are in findings.md.

If a question blocks the active batch, preserve it and release the checkout. Choose a supported project target; a build excluded by the project's contract needs a reason and the user's decision before changing that contract.
