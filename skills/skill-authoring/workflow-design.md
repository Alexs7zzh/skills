# Workflow design

Use these questions when changing a workflow's decisions, stages, actors, or records that survive revisions. Apply the patterns that resolve a named uncertainty. A simple skill may need one actor and a direct check of its result.

## Decisions and stages

Before naming stages, identify the decisions needed to meet the user's goal. For a proposed stage, ask:

- Why is this decision needed, and what triggers it?
- Which inputs and facts must exist before it starts?
- Who owns the decision, and what result must they return?
- What evidence closes it, and what happens when that evidence is unavailable?
- What later change would reopen it, and who handles that change?

Use the answers to resolve unclear boundaries; keep the design note proportional to the uncertainty. Several decisions can belong to one actor. A separate stage earns its cost through a distinct decision, handoff, or information requirement. Outcome standards, procedure choices, and authority remain separate: choosing a procedure does not grant permission for its actions.

For example, a report's figures may need verification before drafting its conclusion. The useful boundary is the checked figures and their limits. Calling the work "research, analyze, review" leaves that dependency unspecified.

## Factual questions and applicable actions

When task facts determine the work, consider asking explicit questions and mapping their answers to actions. State whether the agent chooses one option or applies every matching rule. For each consequential answer, name the fact or evidence that supports it. Define the action for a missing fact; absence of evidence cannot establish that a condition is false.

For a document, "Does it quote a source?" and "Does it calculate a result?" may both be yes. Quote accuracy and calculation checks then both apply. Each check can still have an exclusive verdict such as supported, contradicted, or unresolved. If reasonable alternatives depend on the user's preference, preserve that choice instead of inventing a factual selector.

Use structured selections when another stage needs to inspect or enforce them. A direct wording edit can apply the relevant rule without producing an applicability inventory.

## Questions that survive handoffs

When work passes between actors or resumes later, identify what must remain accounted for. Separately answerable obligations need separately inspectable answers. A category such as "accuracy checked" does not show whether both a document's total and its quoted wording were checked.

For shared records, use the artifact rules in SKILL.md. Give each owed answer an identity, its evidence or concrete blocker, and a responsible actor. One evidence source may answer several questions; record which claim it settles. Question count does not require the same number of agents, tests, or evidence files.

Decide how completion accounts for all required questions, including clean answers and exclusions. A checker can detect a missing answer to an inventoried question. Source review must still establish whether the inventory omitted a required question and whether its answers are true.

## Revision and completion

When results may be revised or reused, design the continuation as well as the first pass. Ask which inputs each conclusion depends on, what changes invalidate it, and who reassesses it. Bind completion to the current inputs and conclusions.

For example, a corrected exchange rate reopens dependent converted totals. An unrelated approved spelling correction can remain settled. Preserve applicable evidence; changed input facts can invalidate an unchanged sentence, while formatting alone need not invalidate its meaning.

If a helper carries prior decisions forward, test both invalidation and reuse. A refreshed identifier or digest cannot establish renewed support. Make unresolved affected decisions visible to the actor who must settle them.

## Actors and information

When considering another actor, name its contribution: a different source of knowledge, independent checking, or parallel work that reduces waiting. Compare that benefit with coordination cost. Assign distinct jobs and return evidence for the decision they serve.

For independent checking, define what the checker may see before and after forming its own assessment, and retain evidence of that order. A fresh context limits exposure to an earlier answer but may share the same model's blind spots. Specify the evidence that can resolve a disagreement; agreement alone does not establish the external facts. An instruction to challenge or disagree needs evaluation against ordinary checking before becoming a requirement.

Compare models by the obligations they preserve and the evidence their records let another actor inspect. Compatible records and common decision criteria can coexist with different wording or factual conclusions. Resolve consequential differences from evidence or the user's decision.

## Checks at the affected stage

For a local change, consider a focused fixture that supplies the inputs to the changed decision or handoff. Keep supplied prior work separate from the stage being evaluated. A synthetic prior assessment cannot establish that an earlier actor actually inspected its source or worked independently.

Test the actual producer and consumer when their handoff changes. Broaden to the affected workflow when routing, information order, authority, or dependencies between stages change; a supplied input can hide a defect in the stage that should produce it. Include a simple valid case that should finish without extra machinery.

When comparing models or procedures, hold common guidance and task inputs fixed; vary only the named intervention and retain its exact version. Retain actual model settings, reads, tool results, and outputs. Keep expected outcomes outside workload packets. Score factual decisions, record validity, procedural compliance, reporting accuracy, and cost separately. A schema pass does not establish source truth, and agreement on one small set does not establish general reliability.

Use repeated or unseen cases when they can distinguish the proposed improvement from an alternative. If a comparison shows no improvement, retain that limit instead of promoting a more expensive procedure. Keep measured results with eval evidence; the skill should carry the applicable decision rule and its limits.
