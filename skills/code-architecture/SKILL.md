---
name: code-architecture
description: "Model a subsystem's constraints, design its ideal structure from them, and compare that design to the code."
disable-model-invocation: true
---

# Code architecture

Establish the subsystem, revision or branch, requested stages and output location from the request and repository. The stages are extract, design, compare and synthesize. Run the stages the user requests. An extract-only request stops after the model. Design and compare run when the user asks for review. Implement only when the user asks for code changes, following the project's coding workflow.

A named branch is a target, not permission to switch a shared checkout. Preserve existing work and use the requested revision without creating another checkout unless authorized.

Honor the user's model and effort choice for each role: extractor, delegates, designer, comparers and synthesizer. Disclose an unavailable requested execution rather than silently substituting.

## Extract

Read [extract.md](extract.md). Use a separate agent so its attention goes to the model. Give it this skill's path, the user's question, target and boundary, relevant rulings, report destination and permitted side effects. Do not preload a diagnosis.

The extractor may delegate bounded source areas when parallel reading helps. Each delegate reads extract.md and writes its area's rows in every section it touches; the extractor merges them and owns the cross-area rows and the couple section. Partition by source boundary, not by model section. If delegation is unavailable, keep the areas with the extractor and disclose the limit.

Extraction is read-only on the target project. Write outputs outside tracked project source unless the user names a project destination. Use existing evidence: the source, installed packages and version-matched provider documentation are all available evidence. Do not launch builds, applications, external mutations or measurements to fill rows. Surface a prerequisite that is genuinely unavailable and continue independent work.

## Design

Read [design.md](design.md). Give a fresh agent the model without its appendix, the goals and rulings, and the path to design.md and lenses.md. Do not give it the source tree or permission to read it.

## Compare and synthesize

Read [compare.md](compare.md). Give fresh comparers what compare.md lists, including the project's review instructions. Keep them independent until synthesis. Hand synthesis to a fresh agent. After the user confirms or refutes the findings, append the synthesis's ledger rows to `evals/lens-ledger.md`.

## Skill trials

When maintaining this skill or running one of its trials, read [evals/workflow.md](evals/workflow.md) as coordinator. Trial agents must not read it.
