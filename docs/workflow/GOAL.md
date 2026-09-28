# Workflow goals

These are the user's stated goals for developing the coding and visual workflow. Read them before proposing or changing that workflow. Each maintained skill's `GOAL.md` owns its specific behavior.

## Why

Agents can produce more code than the user can carefully inspect. The workflow must let the user understand and steer consequential product and design choices without reading every line. Skills carry personal preferences and correct recurring agent misalignment that a capable model would not otherwise know. A workflow phase alone does not justify a skill, nor does a wrapper around a simple request.

## Values

- Human attention is expensive, but the user decides where to spend it. Match the explanation and questions to the requested work. Preserve consequential agreed domain definitions in existing project goals or domain documentation, without requiring a glossary or ADR system.
- The user owns product priorities and material tradeoffs. Agents investigate discoverable facts and choose engineering methods within those priorities. Make consequential assumptions visible; an agent-written spec or general go-ahead does not turn them into human rulings.
- Planning has limits. Reading and implementing against real code reveals constraints that discussion cannot settle. Decide what can usefully be decided now, then learn from a concrete implementation.
- Implement candidates with shipping quality while remaining willing to discard or rewrite them. Effort already spent is not a reason to preserve a poor design. Cheap code generation does not make changes to external state or delivery reversible.
- Visual design inspection is optional. For ordinary web work, the user may ask for implementation and a PR, then review and comment there. Do not insert a separate walkthrough or approval checkpoint. The user can add inspection when it becomes useful.
- When inspection is wanted, ground diagrams and focused explanations in the actual implementation. Make interfaces, ownership, logical and runtime dependencies, failure behavior, and performance or memory costs understandable without requiring a full code reading. Complex systems with tight performance and memory dependencies, or substantial subsystem restructuring, are potential uses. The useful level of detail must be learned through use.
- Tie implementation views to the candidate revision and relevant code locations. Separate observations, measurements, code-based inferences, and unknowns. Mark alternatives as proposals and update affected views after changes.
- Human design inspection and independent code review answer different questions. When requested, inspection lets the user challenge priorities, complexity, or experience after seeing the candidate; technical review and validation still need to establish whether the resulting code works. Neither a diagram nor an extra human checkpoint is a universal workflow phase.
- Work may form a dependency graph. Preserve real prerequisites among decisions, investigations, and implementation tasks. Do not invent a linear sequence or fully specify distant work before its constraints are known.
- Durable memory holds a small, inspectable set of goals, human rulings, and their reasons and scope. Working plans, todos, investigations, and design alternatives are temporary. Retire completed working material after preserving outstanding obligations and durable intent. Code describes the implementation; old plans do not govern future agents.
- Keep the maintained coding and visual skills portable across projects, Codex and Claude Code, Plastic SCM and Git. Configure source control and task tracking independently per project. References inform development but are not runtime dependencies of published skills.

## Open choices

The useful detail and format of implementation views, and whether focused design inspection needs its own skill, remain open. Test these with real work before treating them as rules.

Interactive prototyping and alternative-interface comparison remain optional capability candidates. A prototype should answer a stated question at a useful fidelity, expose relevant state, and make its limits clear. Whether an agent should suggest or autonomously produce one remains undecided. These candidates do not add mandatory workflow stages or authorize new work.
