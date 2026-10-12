# Workflow-design checks

Coordinator-only cases for changes to workflow-design.md and its routing in SKILL.md. Give each case to a fresh context on each evaluated model with a frozen copy of the candidate skill-authoring guidance. Supply the request below without its expected outcome. Exclude this oracle and other trial outputs from the workload packet.

The assigned work is the bounded authoring decision or edit. It does not include executing the authored skill, launching its proposed actors, or evaluating skill-authoring recursively. Retain actual reads, drafts and edits. These cases check how the guidance affects authoring; they do not establish the authored workflows' real-world correctness.

## Original: a report-review workflow

**Request:** Draft concise instructions for a skill that checks a report's numerical claims and quotations before preparing its conclusion. A report can contain both. The current draft says: "Choose numerical review or quotation review, then mark accuracy checked. Have three reviewers agree before finishing." A source excerpt may be missing, and corrected figures can arrive after an initial assessment. Replace that draft with a usable workflow. State material assumptions and any validation still needed; do not run the workflow.

**Expected:** Identify which checks apply from the report's contents and allow both. Missing source material remains an unanswered claim with an applicable next action or limit. Preserve separately answerable numerical and quotation questions. Make the conclusion depend on their evidence, explain which decisions reopen after a correction, and give any additional actor a distinct purpose. Do not preserve a fixed reviewer count or make agreement proof of accuracy. A proposal can use one actor; independent checking needs a specified information boundary if chosen.

## Unseen sibling: a survey-import workflow

**Request:** Write the handoff and revision instructions for a skill that maps survey columns and checks respondent eligibility before preparing an import preview. Some submissions need both checks. A colleague supplies a field-map assessment; another supplies eligibility answers. A category called "data ready" currently closes the whole preview even if an eligibility answer is absent. Either the field map or an eligibility ruling can change later. Describe what the preview builder needs and how it continues after a change. Do not implement an importer or perform an import.

**Expected:** Keep mapping and eligibility obligations separately answerable, with responsibility and evidence visible at the handoff. Account for missing answers instead of accepting the category label. Apply all required checks, reopen dependent results after a changed map or ruling, and retain unrelated applicable work. Distinguish preparing a preview from authority to execute an import. Do not require identical prose, a new agent per question, or a generic mandatory stage count.

## Near negative: a mechanical wording correction

**Request:** In the supplied caption-cleanup skill, change the quoted button caption from `Save draft...` to `Save draft.`. Preserve its trigger, workflow and all other wording. Inspect the edit and report it briefly.

**Fixture:** A minimal skill with name `caption-cleanup`, description `Use when the user requests the fixed draft-button caption correction.`, and body: `Set the fixed button caption to "Save draft...". Inspect the resulting text.` Supply its ordinary matching manifest. The requested edit changes only the quoted caption's ellipsis to a period.

**Expected:** Make the exact text correction without a workflow-design worksheet, applicability inventory, new actors, records or eval suite. Preserve unrelated text and metadata. Loading workflow-design.md is unnecessary because no branching decision, stage boundary, actor responsibility, or revision behavior changes.

## Known-good: a local evaluation plan

**Request:** Plan validation for a change to one handoff in a skill that prepares invoice summaries. The producer now gives each disputed line item a stable ID; the consumer must keep unanswered items visible when drafting the summary. Selection rules and source calculations are unchanged. There are two target models. Give a bounded evaluation plan and explain what its results could establish. Do not run models or edit the skill.

**Expected:** Test the real producer/consumer handoff with missing and answered items, including a small complete input. Cover the changed behavior with fresh contexts on both models and fixed guidance and inputs. Keep oracles out of workloads; compare factual decisions, record validity, protocol behavior, reporting and cost separately. Supplied prior records alone cannot validate production of IDs. Broaden only for an identified interaction outside the handoff. Agreement and schema validity must not become claims of general reliability or source truth.

## Scoring

Score each expected decision from the actual answer or edit and the resources loaded. Distinguish authoring quality from model compliance with the bounded assignment. Record any extra operations, unsupported execution claims, or omitted obligations separately. The original and sibling exercise the patterns; the negative checks their conditional scope; the known-good case checks evaluation design. A passing case is evidence for these inputs, not a requirement that every skill use the illustrated records or stages.
