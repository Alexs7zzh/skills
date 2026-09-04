# Diagnose

The procedure from symptom to cause. Read when the task is to debug or diagnose.

## Choose the mode

Name plain or deep beside how far you go in your first line.

| The input | What to do |
|---|---|
| One symptom, or one export or issue list however many symptoms it holds, and no cause on a risk surface | Plain. Follow the loop and the steps below. |
| Several independent symptoms, exports, or issue lists; or the user asked for an exhaustive diagnosis | Deep. Read [deep.md](./deep.md) and choose your role at the top. |
| The user asked for a deep run, or a cause sits on a risk surface | Deep. Read [deep.md](./deep.md) and choose your role at the top. |

Risk surfaces are listed in good-code.md. Escalate mid-diagnosis if a cause lands on a risk surface: say you are escalating, run `"$LEDGER_DIR/bin/ledger.ts" run escalate` if the plain run already has a database, then read deep.md.

## Build the feedback loop first

A tight pass/fail signal that goes red on this bug does most of the work. Bisection, hypotheses, and instrumentation only consume it. Ways to build one: failing test at the nearest place the code can be driven, script against a running instance, replayed captured trace, throwaway harness, differential run old-vs-new, bisection harness. Then tighten it. Faster: seconds. Sharper: assert the user's exact symptom, not "didn't crash". Deterministic: pin time, seed RNG. Non-deterministic bugs: raise the reproduction rate (loop 100x, stress, narrow timing) until debuggable.

**Completion criterion:** one command, already run once, that is red-capable (asserts the exact symptom, goes green on the fix), deterministic, fast, and agent-runnable. Build it before reading code for a theory. If a loop is genuinely impossible: say so, list what you tried, ask for a captured artifact or environment access.

When the input is telemetry or crash reports from shipped builds, the loop is a deterministic assertion over the export: it goes red on the exact rows and cannot go green locally, the one exception to the criterion above. Say that once for the run, not once per issue, and build a local test whenever the code path admits one, because a test that drives the real code outranks the assertion.

## Then, in order

1. **Reproduce and minimise.** Watch the loop go red on the user's failure mode (not a nearby one). Shrink until every remaining element is load-bearing. The minimal repro shrinks the hypothesis space and becomes the regression test.
2. **Hypothesise in threes.** 3 to 5 ranked falsifiable hypotheses before testing any, each with its prediction: "if X is the cause, changing Y makes it disappear". Show the ranking.
3. **Instrument one variable at a time**, probes mapped to predictions, under the probe rules in SKILL.md. For performance: measure baseline first, then bisect; logs are usually the wrong tool.
4. **Shape the fix at the origin.** Read good-change.md. Classify the origin, finish the sibling sweep it calls for, and read related causes together per findings.md before choosing the shape. Report only stops here, with the proposed fix written.
5. **Shelve the fix.** The red loop becomes the regression test at the right place per good-change.md. Run it red on the unfixed code, apply the fix, build, run it green, keep both logs, shelve, remove every tagged probe. State the confirmed hypothesis in the shelve comment. A fresh subagent reviews the diff with the two questions in deep.md step 7.

## Database

A plain diagnosis writes its causes as issues in a single-seat database, the same rows a deep run writes. Create a run directory per deep.md's Run directory paragraph, then `export LEDGER=<absolute path to the coding skill>/scripts/ledger.ts LEDGER_DIR=<that directory> LEDGER_ME=A` and run `"$LEDGER" init --single --route diagnose --clusters "<the issue or cluster ids>"`. Record each cause as an issue with the clusters it explains, its certainty step, and its evidence path; record questions, proposed fixes, and shelved fixes as separate rows as they arise. `"$LEDGER" report` prints the report below and names every cluster no issue explains. `"$LEDGER" --help` lists the commands. Your `passes:` line and retrospective go in `A-notes.md` in the run directory, which the report appends.

## Report

Every reported cause names its certainty step, and every cause left below step 4 names the fifteen-minute probe that would raise it, run or skipped with why. Every proposed fix carries these slots, or is marked a direction rather than a proposal:

- origin class and shape, per good-change.md
- the sites it touches, walked at file:line or applied and restored
- the recorded rulings, feature docs, and tests asserting today's behavior it was checked against, and what each said
- the red loop or regression test that would catch the bug, and where it goes: one that exists, at its path; one that must be built, and what; or none, which is an architecture issue
- its cost from the code it touches, never a guessed line count

Every cause that recurred in the field names the detector, watchdog, or health check that should have caught it and why it did not; a detector that cannot fire is an issue of its own.

The report separates verified causes from open hypotheses and shows each proposed fix and shelved fix with its state. It ends with the validation line per Declarations.
