---
name: code-architecture
description: "Model a subsystem's constraints, design its ideal structure from them, and compare that design to the code."
disable-model-invocation: true
---

# Code architecture

Find the subsystem, the revision or branch, the requested stages and the output location in the request and the repository. Run the stages the user requests. An extract-only request stops after the model. A review runs extract, design, compare, synthesize and verify. Implement only when the user asks for code changes, under the project's coding workflow.

## Terms

Each term has one meaning in every file of this skill. Do not use a synonym for a term.

- **Model**: the code-free account of the subsystem that extraction writes. A **row** is one table line with an **id**. A **PR row** records what a provider routine writes. A **K row** records a collapse: a combination the lenses forbid and the code permits.
- **Section group**: a set of model sections one agent owns at extraction, design and compare. The groups: external contracts and wrappers; states and gates; lifetimes and interrupts; identities; failures; handoffs and time; diagnostics when selected.
- **Lens**: an invariant with its code form, in lenses.md. Its **slug** is its name.
- **Invariant (I), encoding (E), premise (P)**: the design's rows. An encoding is the code form that enforces an invariant. A premise is a design row about provider behavior the model lacks; extraction records a missing fact as unresolved, never as a premise. "design.md" names this skill's instruction file; the artifact of the same name lives in the output directory.
- **Provider**: the engine, framework or SDK the subsystem calls. A **gate** is a refusal at the only entry, before the write; a refusal after the write, or at one of several entries, is a check at runtime. lenses.md owns these two definitions.
- **Design check**: a comparer's result for an encoding: **passes**, **correction** (a stated value is wrong and the form stands) or **defect** (the form or its level is wrong). "Runtime check" is a Level value of an encoding, not a design check.
- **Divergence**: a place where the code differs from an encoding. Its **disposition** is one of finding, conditional finding, justified tradeoff, not a finding, evidence gap. Its **consequence class** is one of user-visible, ruling, leak, diagnostic, none.
- **Handoff (H)**: a finding written for implementation. A **lower row** is a finding or correction kept on record without a handoff. A **decision** is a choice a handoff waits on. A **default taken** is a choice made on its recommendation.
- **Verdict**: a verifier's result for one part of a handoff: Confirmed, Refuted or Unverifiable.
- **Checker**: `scripts/check_artifacts.py`. Only the checker checks an artifact's shape. Agents extract, design, compare, synthesize and verify.

## Stages

| Stage | Agents | Reads | May open | Writes | Checker |
| --- | --- | --- | --- | --- | --- |
| Extract | one extractor and one delegate per section group | extract.md, lenses.md, goals and rulings, project instructions | project source and provider implementation at the pinned revision | `model.md`, `model-appendix.md` | `python3 scripts/check_artifacts.py model` |
| Design | one designer per section group, then one integrator | design.md, lenses.md, goals; a group designer: the orientation, its sections, the K rows; the integrator: the group files, the orientation, the K rows | nothing | `design-<group>.md`, then `design.md` | `python3 scripts/check_artifacts.py design --group`, then without `--group` |
| Compare | one whole-model comparer and one comparer per section group | compare.md, lenses.md, the model, the design, goals, the project's review instructions | provider implementation and documentation, by the contracts comparer only; project source only for a material gap | `compare-<group>.md` | `python3 scripts/check_artifacts.py compare` |
| Revise | one designer, only when a comparer returned a defect | design.md, the design, the defect rows | nothing | `design-revised.md` | `python3 scripts/check_artifacts.py design` |
| Recompare | one comparer per section group the revised encodings touch | as Compare, revised encodings only | as Compare | `recompare-<group>.md` | `python3 scripts/check_artifacts.py compare` |
| Synthesize | one synthesizer | compare.md, the model, the design, goals, every compare file | one bounded lookup | `synthesis.md` | `python3 scripts/check_artifacts.py synthesis --model` |
| Verify | one verifier per handoff | one handoff, the model's orientation, the appendix excerpts for the rows it cites | project source and provider implementation, read-only | `verify-H<n>.md` | `python3 scripts/check_artifacts.py verify` |
| Final | the synthesizer, continued | the verify files | nothing | `synthesis.md` with Verified lines | `python3 scripts/check_artifacts.py synthesis --model --verified` |

Every agent is fresh unless the table says "continued". A stage whose artifact fails the checker fixes the artifact before the next stage starts. The checker tests the slots, not the content.

The coordinator writes every stage's brief at the start, runs the checker when a stage ends, and launches the next stage on a pass. It reads the checker output and the final synthesis, not the artifacts. Agents of one stage run at once; none waits for a sibling.

## Rules for every stage

- A named branch is a target, not permission to switch a shared workspace. Read the requested revision through version control. Do not create another workspace or check out files unless the user authorizes it.
- Honor the user's model and effort choice for each role. Disclose an execution you cannot provide. Do not substitute silently.
- No stage builds, launches an application, mutates an external system or measures. The only scripts a stage runs are this skill's check scripts. An unknown runtime behavior is an evidence gap or a premise. Put this limit in every brief.
- Do not block a stage on the user. When a choice is open, proceed on the recommended option as a numbered premise. The synthesis lists the choice as a decision or a default taken. Ask mid-run only when no premise lets the stage proceed.
- Give each agent this skill's path and the files its stage reads. Do not preload a diagnosis.
- Each brief names one writable directory. Scratch files go in its `scratch/` folder, and the stage deletes that folder before it ends. Nothing is written anywhere else.

## Extract

Read [extract.md](extract.md). The extractor pins the target, bounds the subsystem, briefs one delegate per section group, merges their drafts and writes the K rows. Each delegate reads the whole bounded source for its sections only. Extraction is read-only on the target project. Write outputs outside tracked project source unless the user names a project destination. If delegation is unavailable, the extractor writes every section and discloses the limit.

## Design

Read [design.md](design.md). Give each group designer the orientation, its sections, the K rows, the goals and rulings, and the paths to design.md and lenses.md; give the integrator the group files, the orientation, the K rows and the goals. Each may look up a model row by id. Do not give them the source tree or permission to read it.

## Compare, synthesize and verify

Read [compare.md](compare.md). Give the comparers what compare.md lists, including the project's review instructions. Keep them independent until synthesis. Hand synthesis to one agent, then one verifier per handoff, then the verify files back to the synthesizer. After the user confirms or refutes the findings, append the synthesis's ledger rows to `evals/lens-ledger.md`.

## Skill trials

When maintaining this skill or running one of its trials, read [evals/workflow.md](evals/workflow.md) as coordinator. Trial agents must not read it.
