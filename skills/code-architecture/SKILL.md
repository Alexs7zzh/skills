---
name: code-architecture
description: "Explicitly research and review a subsystem's architecture and develop concrete remedies."
disable-model-invocation: true
---

# Code architecture

Run when the user explicitly invokes this skill. Establish the subsystem, revision or branch, selected principles, requested stages and output location from the request and repository. Use [principles.md](principles.md) to select applicable questions. Research explains the facts; review judges them and develops remedies. A research-only request stops after the account. When review is requested, continue with [review.md](review.md). Implement only when the user asks for code changes, following the project's coding workflow.

Record the inspected revision and relevant local changes. A named branch is a target, not permission to switch a shared checkout. Honor project access and mutation rules. Preserve existing work and use the requested revision without creating another checkout unless authorized.

## Research

Read [research.md](research.md). Use a separate research agent so its attention goes to explaining the system. Give it this skill's path, the user's question, target, relevant rulings, report destination and permitted side effects. Do not preload a diagnosis. Honor the user's model and effort choice for each role, including delegates. If no choice was given, use the current model and effort; disclose an unavailable requested execution rather than silently substituting.

The research lead may delegate bounded areas when parallel reading helps. Each delegate reads research.md and the relevant principles and writes distinct outputs; the lead owns the integrated report and cross-area facts. Honor an explicit one-agent-per-principle research request with distinct agents. Otherwise partition by useful source boundaries, not automatically by the number of report sections. If delegation is unavailable, keep those areas with the lead and disclose the limit.

Research is read-only on the target project. Write outputs outside tracked project source unless the user names a project destination. Use existing evidence and provider contracts; do not launch builds, games, external mutations or measurements merely to fill report slots. Surface an unavailable prerequisite and continue independent work.

The lead delivers a short orientation and independently readable principle sections after the checks in research.md. Retain revision-specific supporting evidence once. Report unresolved relationships explicitly so later reviewers can judge what is known without repeating discovery.

## Review and handoff

When review is requested, follow [review.md](review.md) using the integrated factual account. Use the user's requested reviewer arrangement; otherwise combine a whole-account reviewer with distinct reviewers for the selected applicable principles. Keep reviewers independent until synthesis. Research and review model choices may differ.

Deliver one reconciled set of concerns and concrete remedies. Missing provider evidence remains a named limit unless it establishes a violated obligation. If implementation is also requested, carry the selected remedies, constraints and checks into the coding workflow without restarting research or requesting approval already supplied.

## Skill trials

Before a trial, retain its behavior under test, bounded workload, permitted side effects and stop condition. A meaningful instruction failure ends the trial: retain partial outputs and the failing case before changing the skill or retrying. When coordinating maintenance of research completeness, review routing or the remedy handoff, use [evals/workflow.md](evals/workflow.md) as coordinator-only material. Stage runtime instruction files separately from evaluator cases and expected answers, so resource discovery cannot expose them. Give trial agents that runtime path, their workload and requested outcome; they must not read evaluator material. Keep trial results outside the architecture account, in the requested evaluation file or `<report-stem>.trial.md`.
