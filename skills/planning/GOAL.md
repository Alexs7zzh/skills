# Goal

Read before discussing or changing this skill.

## Why

The user needs to decide what work is worth doing and understand what can happen next. Agents can help investigate, ask useful questions, and organize dependencies, but can also turn assumptions into apparent decisions or preserve an old plan as authority. This skill keeps intent and work understandable as both change.

Interviewing, writing a brief, and mapping work share the same goals, decisions, and open questions. Keep their shared rules here in one skill and load each method only when needed. They are independent entry points, not a required sequence.

## Values

- **The user chooses where to spend attention.** A requested grilling session can justify many questions. Preserve useful coverage rather than imposing a question budget. A broad backlog warrants broader discussion than one small feature.
- **Decisions have an owner.** Investigate facts and make engineering choices within established goals. Ask the user about product priorities and consequential tradeoffs. A recommendation, silence, or a polished document does not establish a human ruling.
- **Shared words must imply shared behavior.** Probe ambiguous terms with concrete scenarios when their meanings change an outcome. Preserve only consequential agreed definitions in existing goals or domain documentation; do not require a separate glossary or ADR system.
- **Plans are provisional.** Implementation reveals constraints. Agents may revise their methods when evidence changes, while honoring goals and explicit rulings. Do not require a complete design before useful work can begin.
- **Dependencies express necessity.** A work map makes ready work and real blockers understandable. Grouping, priority, and release checkpoints answer different questions. Keep distant work loose until its questions become clear.
- **Durable memory stays small.** Preserve human goals, rulings, and reasons. Briefs, investigations, and task records support active work and then retire. They must not become permanent instructions about how future agents implement the goal.
- **The capability travels.** Source control and task storage are separate project choices. Use the project's configured tracker, including local files, without making GitHub, Git, or a particular agent runtime mandatory.
- **Project facts have one home.** A small project context identifies the task destination, intent documents, and local conventions. Project entry instructions point to it so implementation sessions can find tasks without starting planning. Reuse an existing location; a prescribed filename or setup ceremony is not the capability.
- **The user can enter where needed.** Synthesizing a discussion need not restart an interview. Updating a dependency need not recreate the plan. Ordinary implementation can proceed to the requested review or PR without a visual inspection checkpoint.

## Boundary

This skill establishes and maintains actionable intent. Coding owns technical investigation, implementation, validation, and code review when those are the requested work. Visual inspection is optional and independently useful. Split a planning method into another skill when real usage demonstrates a separate purpose or incompatible defaults, not merely because it has a different verb.
