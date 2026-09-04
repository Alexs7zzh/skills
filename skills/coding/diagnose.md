# Diagnose

The procedure from symptom to cause. Read when the task is to debug or diagnose.

## Choose the mode

Name plain or deep beside report or fix in your first line.

| The input | What to do |
|---|---|
| One symptom, or one export or issue list however many symptoms it holds, and no cause on a risk surface | Plain. Follow the loop and the steps below. |
| The user asked for a deep run, or a cause sits on a risk surface | Deep. Read [deep.md](./deep.md) and choose your role at the top. |

Risk surfaces are listed in good-code.md. Escalate mid-diagnosis if a cause lands on a risk surface: say you are escalating, then read deep.md.

## Build the feedback loop first

A tight pass/fail signal that goes red on this bug does most of the work. Bisection, hypotheses, and instrumentation only consume it. Ways to build one: failing test at the nearest seam, script against a running instance, replayed captured trace, throwaway harness, differential run old-vs-new, bisection harness. Then tighten it. Faster: seconds. Sharper: assert the user's exact symptom, not "didn't crash". Deterministic: pin time, seed RNG. Non-deterministic bugs: raise the reproduction rate (loop 100x, stress, narrow timing) until debuggable.

**Completion criterion:** one command, already run once, that is red-capable (asserts the exact symptom, goes green on the fix), deterministic, fast, and agent-runnable. Reading code to build a theory before this command exists is the failure this file prevents. If a loop is genuinely impossible: say so, list what you tried, ask for a captured artifact or environment access.

When the input is telemetry or crash reports from shipped builds, the loop is a deterministic assertion over the export: it goes red on the exact rows and cannot go green locally, the one exception to the criterion above. Say that once for the run, not once per issue, and build a local seam whenever the code path admits one, because a test that drives the real code outranks the assertion.

## Then, in order

1. **Reproduce and minimise.** Watch the loop go red on the user's failure mode (not a nearby one). Shrink until every remaining element is load-bearing. The minimal repro shrinks the hypothesis space and becomes the regression test.
2. **Hypothesise in threes.** 3 to 5 ranked falsifiable hypotheses before testing any ("if X is the cause, changing Y makes it disappear"). A hypothesis without a prediction is a vibe. Show the ranking; humans re-rank instantly.
3. **Instrument one variable at a time**, probes mapped to predictions, as temporary changes under Permissions. For performance: measure baseline first, then bisect; logs are usually the wrong tool.
4. **Fix at the origin** when fixing; when reporting, propose it in the Report shape below. Before writing the fix or its proposal, read good-change.md and shape it there; before labeling or grading it, read findings.md.
5. **Lock it down** when fixing; when reporting, attach the red loop as the proposed regression test. Regression test at the correct seam, per good-change.md. Re-run the original loop. Remove every tagged edit. State the confirmed hypothesis in the commit message.

## Ledger

A plain diagnosis writes its causes as rows in a single-seat ledger, the same rows a deep run writes, in a run directory placed per deep.md's Run directory paragraph: `ledger.sh init --single --route diagnose --clusters "<the issue or cluster ids>"`, one `add` per cause with its label, clusters, claim, step, and evidence path, and `ledger.sh report` renders the report below once every Bug or Restructure row carries its slots and every cluster has a row; it refuses otherwise and names what is missing. The helper sits beside deep.md and `ledger.sh --help` lists the columns. Your `passes:` line and retrospective go in `A-notes.md` in the ledger directory, which the report appends.

## Report

Every reported cause names its certainty step, and every cause left below step 4 names the fifteen-minute probe that would raise it, run or skipped with why. Every proposed fix carries these slots, or is marked a direction rather than a proposal:

- origin class and fix shape, per good-change.md
- the sites it touches, walked at file:line or applied and restored
- the recorded rulings, feature docs, and tests asserting today's behavior it was checked against, and what each said
- the red loop or regression test that would catch the bug, and its seam: one that exists, at its path; one that must be built, and what; or none, which is an architecture finding
- its cost from the code it touches, never a guessed line count

Every cause that recurred in the field names the detector, watchdog, or health check that should have caught it and why it did not; a detector that cannot fire is a finding of its own.

The report ends with the validation line per Declarations.
