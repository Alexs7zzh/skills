---
name: coding
description: "Use for any task that touches code: implementing or changing it, fixing a bug, reviewing a diff, branch, changeset, PR, or uncommitted changes, or debugging or diagnosing anything broken, failing, or slow, including a bug report, a warning, telemetry or crash reports, or a fix that did not hold."
---

# Coding

Ten concepts govern every code task, as sections across nine files. This file holds the definitions and rules every task uses; each other file holds a method, read at the moment its row names. Read all of this file, then the row you are in, in the order the row gives. When the work changes kind, a review that turns into a fix, a diagnosis that reaches step 4, or a quick review that meets a risk surface, add the new row's files.

| You are | Read, in order |
|---|---|
| Writing or changing code | [good-change.md](./good-change.md); the Values in [good-code.md](./good-code.md), and its lenses when the code sits on a risk surface or the change touches them; [findings.md](./findings.md) when you propose a change wider than the request |
| Reviewing | [review.md](./review.md) first; it decides quick or deep and handles a stated focus. Then good-code.md and findings.md; good-change.md when the change is a fix or you propose one; [deep.md](./deep.md) when review.md says deep |
| Diagnosing | [diagnose.md](./diagnose.md) first; it decides plain or deep. Then findings.md; good-change.md at step 4; good-code.md when a cause sits on a risk surface; deep.md when diagnose.md says deep |
| Dispatched as a peer into a two-family run | deep.md first, for your role; then the route the dispatch names, review.md or diagnose.md; then good-code.md, good-change.md, findings.md |
| Editing this skill | [maintaining.md](./maintaining.md), then the file you edit |
| Any row, on Unreal Engine or C++ code | [unreal.md](./unreal.md) as well |
| Any row, where the project has its own review or diagnosis doc | That doc as well, before judging: it carries the project's values, recorded rulings, and repo facts |

Writing has no route file: this file and good-change.md govern it. Risk surfaces are listed at the top of good-code.md.

## Certainty

What a claim rests on, by step:

1. "I said so." Closes nothing.
2. Pointed at the line or the provider's own source.
3. Walked the failure and it cannot reach.
4. Ran real code: probe, compiled replica, executed test, log evidence, retained logs included.
5. Reproduced live in the running system yourself, this pass.

Names, comments, docs, commit messages, and another agent's report are testimony: they say where to look and prove nothing until the code or a run confirms them. How a claim is proved, and what a dismissal needs, is in findings.md.

## Attention

- Fan out per independent unit, an issue, a sweep, a lens, or a claim cluster, one subagent each, with disjoint scopes named in the dispatch. Keep the model of the change, the verdicts, and the composition yourself. Those are the steps that cannot be delegated.
- Delegate what arrives as bulk: file dumps, build and test output, probe transcripts. Subagents return conclusions with file:line and certainty step. Artifacts stay on disk and are referenced by path. Read a suite's summary and failure lines rather than its log. Independent commands batch inside one lane, which needs no delegation.
- Cheap agents enumerate and flag. They never own a verdict, because they report confident false cleans on exactly the rows that matter.
- A brief states the question and the acceptance criterion, never the expected answer. A fresh reader gets claims, file:line, and evidence paths, never your arguments: a fresh context fed your reasoning is not fresh.
- Launch builds and tests in the background and keep working; never sleep on them.

## Declarations

What you say about your own work, every time:

- Line one names report or fix, and the mode: quick or deep for a review, plain or deep for a diagnosis.
- Every claim names its certainty step. A number that arrives in a sentence rather than from a run is marked reasoned. A probe's result states the input class it ran on, since a result holds only for the signals, sizes and parameters it ran on.
- A skipped pass or an unrun probe is named, with why. Report mode is never the reason.
- The answer ends with a validation line: what built and ran, with results, and that the workspace is restored when temporary edits were made.

## Permissions

Every task either reports or fixes.

- **Report.** Review and diagnosis report by default: findings, verdicts, and proposed fixes in their fix shape, with nothing applied. A fix round starts only on the user's go, dispatched from the report's fix table or dispositions and nothing else. Reporting withholds only the lasting change; every test and probe a fix would run still runs.
- **Fix.** The user asked for a change. Change what the request needs and nothing else; a wider change is proposed under Report. Build and run the owning tests per batch of independent changes and before the answer; a doc-only edit needs no rerun.

In either case, temporary changes that gather evidence are allowed, and encouraged whenever a reproduction settles what argument cannot: probes, tagged logs, temporary tests, compiled replicas, off-design parameters through existing helpers. One rule set governs them:

- Tag every temporary edit with one unique token, so cleanup is one grep.
- Never change the behavior under review or diagnosis, and never count a temporary change as a fix.
- Back up and hash each file before editing it. Remove every tagged edit once, before the answer. When reporting, verify the workspace against the reviewed revision rather than the SCM status line.
- A temporary test that goes red on a finding or proves a fix is a candidate regression test: attach it as a proposed patch, or delete it.
- In a shared workspace, one agent edits temporary changes at a time. Others request probes from it rather than racing.

A diagnostic log meant to ship for a release cycle is not a temporary change. It is a logging change, and it follows the project's logging policy.
