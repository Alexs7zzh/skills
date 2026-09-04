# Diagnose

The procedure from symptom to cause. Read when the task is to debug or diagnose.

## Choose the mode

Name plain or deep beside the stopping policy in your first line.

| The input | What to do |
|---|---|
| One symptom, or one export or issue list however many symptoms it holds, and no cause on a risk surface | Plain. Follow the loop and the steps below. |
| Several independent symptoms, exports, or issue lists; or the user asked for an exhaustive diagnosis | Deep. Read [deep.md](./deep.md) and choose your role at the top. |
| The user asked for a deep run, or a cause sits on a risk surface | Deep. Read [deep.md](./deep.md) and choose your role at the top. |

Risk surfaces are listed in good-code.md. Escalate mid-diagnosis if a cause lands on a risk surface: say you are escalating, then read deep.md.

## Build the feedback loop first

A tight pass/fail signal that goes red on this bug does most of the work. Bisection, hypotheses, and instrumentation only consume it. Ways to build one: failing test at the nearest seam, script against a running instance, replayed captured trace, throwaway harness, differential run old-vs-new, bisection harness. Then tighten it. Faster: seconds. Sharper: assert the user's exact symptom, not "didn't crash". Deterministic: pin time, seed RNG. Non-deterministic bugs: raise the reproduction rate (loop 100x, stress, narrow timing) until debuggable.

**Completion criterion:** one command, already run once, that is red-capable (asserts the exact symptom, goes green on the fix), deterministic, fast, and agent-runnable. Build it before reading code for a theory. If a loop is genuinely impossible: say so, list what you tried, ask for a captured artifact or environment access.

When the input is telemetry or crash reports from shipped builds, the loop is a deterministic assertion over the export: it goes red on the exact rows and cannot go green locally, the one exception to the criterion above. Say that once for the run, not once per issue, and build a local seam whenever the code path admits one, because a test that drives the real code outranks the assertion.

## Then, in order

1. **Reproduce and minimise.** Watch the loop go red on the user's failure mode (not a nearby one). Shrink until every remaining element is load-bearing. The minimal repro shrinks the hypothesis space and becomes the regression test.
2. **Hypothesise in threes.** 3 to 5 ranked falsifiable hypotheses before testing any, each with its prediction: "if X is the cause, changing Y makes it disappear". Show the ranking.
3. **Instrument one variable at a time**, probes mapped to predictions, as temporary changes under the stopping policy. For performance: measure baseline first, then bisect; logs are usually the wrong tool.
4. **Shape the remedy at the origin.** Read good-change.md. Sweep the cause's siblings and interactions until its connected group is stable, then compose related Claims before choosing the Remedy. Report stops with the evidence or reviewed Remedy its policy calls for.
5. **Lock down a landing.** Under Land or Check in, reuse the red loop as the regression test at the correct seam, run it red before the fix and green after, and keep both runs. Remove every tagged edit. State the confirmed hypothesis in the commit message.

## Ledger

A plain diagnosis uses a single-seat run ledger with the six objects from findings.md. Create a fresh directory per deep.md's Run directory paragraph, set `LEDGER=<absolute path to the coding skill>/scripts/ledger.ts`, export `LEDGER_DIR=<that directory> LEDGER_ME=A`, then run `"$LEDGER" init --single --route diagnose --policy <report|prepare|land|check-in> --clusters "<the issue or cluster ids>"`. Record each cause as a Claim with its covered clusters, step, and evidence path; record Decisions, Remedies, Landings, and Deliveries separately as they become relevant. `"$LEDGER" report` renders a deadline snapshot and names open coverage and work. `"$LEDGER" --help` lists the commands. Your `passes:` line and retrospective go in `A-notes.md` in the ledger directory, which the report appends.

## Report

Every reported cause names its certainty step, and every cause left below step 4 names the fifteen-minute probe that would raise it, run or skipped with why. Every proposed fix carries these slots, or is marked a direction rather than a proposal:

- origin class and fix shape, per good-change.md
- the sites it touches, walked at file:line or applied and restored
- the recorded rulings, feature docs, and tests asserting today's behavior it was checked against, and what each said
- the red loop or regression test that would catch the bug, and its seam: one that exists, at its path; one that must be built, and what; or none, which is an architecture finding
- its cost from the code it touches, never a guessed line count

Every cause that recurred in the field names the detector, watchdog, or health check that should have caught it and why it did not; a detector that cannot fire is a finding of its own.

The report separates verified causes from open hypotheses and marks each Remedy and Landing with its current state. It ends with the validation line per Declarations.
