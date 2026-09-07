---
name: planning
description: "Use when the user asks to plan or scope a feature, grill them about an idea or backlog, turn a discussion into a spec or issues, organize or revise a roadmap or work dependencies, or configure project task tracking."
---

# Planning

Establish or update actionable intent at the entry point the user requested. Read the shared rules below, then only the method needed. These routes are not sequential gates.

| Request | Read |
|---|---|
| Explore intent, grill the user, reassess a backlog | [interview.md](./interview.md) |
| Turn established discussion into a brief or spec | [brief.md](./brief.md) |
| Create, split, migrate, or revise issues and dependencies | [map.md](./map.md) |
| Configure task tracking, resolve an issue reference, or find where work should be stored | [project.md](./project.md) |

Add another method when the work calls for it, retaining the established context. An interview can end with answers; a brief is not required before issues. A request to implement or review existing work does not start this workflow merely because execution requires some planning. Use the coding skill when available for that work. Do not add a visual walkthrough or approval phase the user did not request.

Read [GOAL.md](./GOAL.md) when discussing or changing this skill's purpose or values.

## Shared rules

- **Ground the request.** Read applicable project goals, human rulings, and the relevant code or existing work records. Check claims against their sources; an old status, test, or design document is evidence to inspect, not automatic proof of current behavior or desired intent.
- **Keep authority visible.** Distinguish human rulings, established facts with their limits, agent proposals, and unanswered questions. Record a ruling with its source, scope, and reason when given. Do not invent a rationale. General approval does not make unstated details human decisions.
- **Own engineering judgment.** Investigate discoverable facts rather than asking the user. Ask about choices that change a material product promise, exceed scope, or require a priority only the user can choose. If evidence challenges a ruling, show the consequence and recommendation; do not silently override it. A question blocks only dependent work.
- **Keep methods revisable.** Write outcomes and distinguishing acceptance scenarios. Mark implementation approaches as provisional. When new evidence changes the approach, update affected work and assumptions; seek a new ruling only when the change crosses a human decision or scope boundary.
- **Use project configuration.** When resolving an issue reference, storing work, or setting up tracking, read project.md and follow the project context linked by the repository instructions. An interview with sufficient supplied context needs no setup ceremony. Do not invent a second authoritative backlog when the configured tracker is unavailable. Preserve a temporary handoff and report the limitation.
- **Match the authorized action.** Draft when asked to draft; publish when asked to publish. Do not add another permission round for an already authorized action. A request to interview does not by itself request implementation or publication.

## Retain and retire

During active work, preserve enough task state to resume: current outcome, rulings and sources, consequential assumptions, unresolved questions, dependencies, candidate or evidence pointers, and next ready work. Use the owning task record; link detail rather than repeating it in every document. A new session does not require a new plan.

Keep durable human goals and rulings with their reasons and scope in the project's maintained intent documents. Agent-filled methods stay provisional in working records. Preserve implementation in code and tests, and needed operating procedures in their maintained home.

Before retiring working material, account for outstanding obligations, move durable intent to its maintained home, and verify destinations and pointers. Retire completed local plans and briefs; close external tasks according to the project's convention. Do not delete unresolved work or treat closed historical plans as instructions for future implementation.
