# Workflow experiments

Temporary development notes. These proposals are not human rulings. Read `GOAL.md` first. Retire these notes once the resulting skills and project configuration carry the useful behavior.

## Current state

The user reports the O-Me-IO todo-to-GitHub migration complete. Project goals live in `/Users/alex/dev/o-me-io/docs/goals.md`; tracking instructions live in that project's `docs/runbooks/github-task-tracking.md` and `AGENTS.md`. Do not repeat the migration or create a parallel backlog here.

The user reports a smooth interview of roughly 30 questions. Questions clarified scope, the attention cost was acceptable, and even less useful questions remained valid. Broad future-roadmap coverage reflected the old backlog's breadth; the user does not want corrective rules for that one-off circumstance. The translation to issues worked well, and the dependency graph makes available work understandable through GitHub's blocked/unblocked filtering. The user requests no adjustments to the experienced workflow. Implementation from those issues has not yet been tried, so execution quality and dependency accuracy during delivery remain untested.

## First draft: planning

The first draft lives in `skills/planning/`. Its `GOAL.md` owns its durable motivation, and `SKILL.md` routes to interview, brief, and map methods. It uses the practical name planning. The draft still needs real use beyond the completed reference-based migration; do not claim that migration validated this new implementation.

The recurring problems it would address are treating old plans as authority, asking the user for discoverable facts, silently deciding product priorities, and losing real prerequisites in a linear task list. An implement wrapper does not address these problems.

Candidate mechanisms include dependency-aware interview rounds with recommendations, provenance for human rulings, separate grouping and blocking relationships, and project-configured task storage independent of source control. Interview depth remains the user's choice.

Current feedback is sufficient to draft the first version without requiring a transcript or inventing a failure to fix. Preserve the successful interview and graph behavior. Collect specific exchanges later when a real miss needs diagnosis.

## Boundary to evaluate

Start with one capability for establishing and maintaining actionable intent, with separate methods loaded for interviewing, synthesizing an agreed brief, and mapping or revising dependent work. The shared rules concern decision authority, assumptions, scope, task relationships, and temporary versus durable information. Methods can be entered independently; requesting a brief does not restart an interview, and revising blockers does not rerun planning.

This boundary is a proposal, not a user ruling. The user raises the same maintenance concern that led to combining code writing, review and diagnosis in the coding skill: keep shared judgment in one place and load task-specific methods progressively. Several small skills remain an option if actual invocation needs justify them.

Keep implementation and code review in coding. Keep optional visual inspection separate from the proposed planning capability. Project tracker instructions supply provider mechanics. Split the proposed skill if its methods develop unrelated purposes, require contradictory defaults, or repeatedly load irrelevant context despite routing. A separate verb alone does not establish that split.

## Ordinary coding

Use the existing coding skill for requested implementation, diagnosis, evidence and independent review, with the project's delivery rules. A request to implement an issue and open a PR needs no separate visual-inspection phase. Learn from normal PR comments as well as special trials.

Do not silently change existing project issue dependencies. If a selected issue still specifies a separate inspection checkpoint, reconcile it with the user's current scope when working that issue.

## Optional trial: Stripe design inspection

The user wants to review the older Stripe payment code with the current coding skill and consider restructuring or replacement. A newer model and stronger skill motivate reassessment; they do not establish that the design is defective or a rewrite is required. Scope and tracking belong in O-Me-IO when that work starts.

If the user wants focused views, try an overview and deeper views of the parts under discussion. Show actual behavior, interfaces, ownership, state transitions, relevant dependencies, failure and recovery, and meaningful costs. Choose detail according to the subsystem and the user's questions.

Views must trace to the candidate revision and relevant code locations. Separate observations, measurements, code-based inference, and unknowns. Label alternatives as proposals and update affected views after changes. A tidy diagram or favorable human reaction does not establish correctness.

This is a possible trial for an independently invoked implementation-inspection skill. It is not a prerequisite for ordinary delivery or for drafting the shaping skill.

## Learning and skill creation

When a workflow misses, retain the actual prompt, relevant output, expected behavior, and whether the skill loaded. Locate the owning layer: trigger, instructions, presentation, project configuration, or helper. Change the smallest mechanism and check an unseen sibling case.

Once a capability earns a skill, put its durable motivation in that skill's `GOAL.md`, write the smallest executable `SKILL.md` and manifest, and test it in a fresh context. Run the repository validator and nearest realistic workflow check. Do not duplicate rules across the new skill and coding.

These documents preserve intent across sessions. Executable skills remain under `skills/`; this is a provisional design outline, not an installed skill. Do not leave hidden draft skill directories in the published tree.
