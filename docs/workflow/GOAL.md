# Workflow goals

These are the user's stated goals for developing the coding workflow. Read them before proposing or changing its skills. The skill boundaries and experiments in `experiments.md` are provisional; they are not approved implementation plans.

## Why

Agents can produce more code than the user can carefully inspect. The workflow must let the user understand and steer consequential product and design choices without reading every line. Skills carry personal preferences and correct recurring agent misalignment that a capable model would not otherwise know. A workflow phase alone does not justify a skill, nor does a wrapper around a simple request.

## Values

- Human attention is expensive, but the user decides where to spend it. Preserve potentially valuable questions during a requested grilling session; do not impose a shallow interview or a fixed question budget in the name of efficiency. Breadth follows the task: a whole backlog can justify many questions, while a small feature naturally narrows the discussion. Lower-value but valid questions are not automatically workflow failures.
- Preserve only consequential agreed domain definitions in existing project goals or domain documentation. No mandatory glossary or ADR system. The planning skill owns the scenario-based clarification method.
- The user owns product priorities and material tradeoffs. Agents investigate discoverable facts and choose engineering methods within those priorities. Make consequential assumptions visible; an agent-written spec or general go-ahead does not turn them into human rulings.
- Planning has limits. Reading and implementing against real code reveals constraints that discussion cannot settle. Decide what can usefully be decided now, then learn from a concrete implementation.
- Implement candidates with shipping quality while remaining willing to discard or rewrite them. Effort already spent is not a reason to preserve a poor design. Cheap code generation does not make changes to external state or delivery reversible.
- Visual design inspection is optional. For ordinary web work, the user may ask for implementation and a PR, then review and comment there. Do not insert a separate walkthrough or approval checkpoint. The user can add inspection when it becomes useful.
- When inspection is wanted, ground diagrams and focused explanations in the actual implementation. Make interfaces, ownership, logical and runtime dependencies, failure behavior, and performance or memory costs understandable without requiring a full code reading. Complex systems with tight performance and memory dependencies, or substantial subsystem restructuring, are potential uses. The useful level of detail must be learned through use.
- Human design inspection and independent code review answer different questions. When requested, inspection lets the user challenge priorities, complexity, or experience after seeing the candidate; technical review and validation still need to establish whether the resulting code works. Neither a diagram nor an extra human checkpoint is a universal workflow phase.
- Work may form a dependency graph. Preserve real prerequisites among decisions, investigations, and implementation tasks. Do not invent a linear sequence or fully specify distant work before its constraints are known.
- Durable memory holds a small, inspectable set of goals, human rulings, and their reasons and scope. Working plans, todos, investigations, and design alternatives are temporary. Retire completed working material after preserving outstanding obligations and durable intent. Code describes the implementation; old plans do not govern future agents.
- Keep the workflow portable across projects, Codex and Claude Code, Plastic SCM and Git. Configure source control and task tracking independently per project. References inform development but are not runtime dependencies of published skills.

## Open choices

The current grilling approach is acceptable to the user without adjustment. The detail and format of implementation views, skill names or boundaries, and a general tracker configuration format remain open. Test these with real work before treating them as rules.

O-Me-IO is the first trial project. GitHub owns its active work, using understandable scopes and dependency relationships. Its maintained project goals and tracking instructions own project-specific rulings. The user wants to assess its older Stripe payment implementation with the current coding skill and consider restructuring or replacement where the evidence justifies it. Focused design inspection may help with that work; ordinary feature implementation can proceed directly to a PR when requested.
