# Goal

Why this skill exists, what it values, and why its features have their shape. Read before discussing or changing it, and let every suggestion follow it.

## Why

One skill serves review, diagnosis, and writing because they share the same project, evidence, and judgment. It is designed for agents doing real work: writing code is cheap, while human attention, trust, and lost context are expensive. The standards travel across projects; the design choices depend on the project's goals and constraints.

## Values, in the order they win

1. **The right behavior, supported by evidence.** Correctness means meeting the feature's goals, intended user experience, explicit human rulings, and real system contracts. Reliability includes recovery and an honest, usable outcome when an external prerequisite cannot be restored. Evidence must distinguish the claim from an alternative that would make it wrong. Execution, measurement, and code proof answer different questions; agreement alone answers none.
2. **The user can trust, understand, and steer the work.** Agents own implementation choices and challenge a plan that defeats the goal. A long agent-written spec is not evidence that a human decided every detail in it. The user sees consequential choices, uncertainty, and why a change took its shape, without having to read the whole investigation. Changes remain recoverable, and another reader checks the result before it is called reviewed.
3. **The project stays understandable.** A later reader has less context than the agent that wrote the code. Ownership, state changes, contracts, and failure outcomes should be clear from the code and its named interfaces. Evaluate simplicity across the subsystem and its callers, not just interface size or lines deleted. Complexity earns its place when its contribution to a present obligation or a clearer design justifies its costs.
4. **No wasted work or attention.** Within those values, remove waiting, repeated discovery, and ceremony. Code generation and reversal are cheap; regression risk, integration work, and human comprehension still cost something. Scale records and checks to the decisions and risk, not the number of agents or lines changed. A mechanical correction needs direct validation, not the full candidate workflow. A step earns its place by reducing a concrete uncertainty or preserving information, not because human-written code used to pass through it.

## How we think about the workflow

- **Information continuity.** The ledger is working memory for substantive single-agent work as well as shared coordination. A useful record can begin before there is a finding: it keeps the current goal, decisions, evidence pointers, and next action outside the agent's context. The investigator develops the candidate while the code, experiment, and alternatives are still in context. A second reader judges the claim, evidence, and candidate together. Separate records preserve what changed; they do not impose approval of each intermediate thought. A session ending does not end the task or discard its evidence.
- **Agents' limits shape the mechanisms.** They have limited attention, forget, and can reinforce each other's assumptions. Hence a database that remembers state, subagents for bulk, independent discovery, and fresh review. Different model families add diversity; they do not replace evidence. Fresh review avoids anchoring without destroying the author's rationale.
- **Keep pushing on the concepts.** Read each run's record for where time and information were lost. Rethink the shape before adding a step. The database keeps the shared sequence of work and decisions; its timeline distinguishes recorded actions from inferred activity. Artifacts retain the detail needed to resume, without loading it all into every agent's context.
- **Separate coordination from judgment.** The script preserves agreements between actors; the Markdown guides judgment about the work itself.
- **Recording is not delivery.** Investigators save work without depending on runtime messaging permissions. One coordinator observes current work and bound agent state, wakes idle agents when useful, and retains delivery uncertainty. Busy agents pull their next work; an accepted wake is not progress, and a pause is not an invitation to restart.

## What we do not do

- **No mechanism without an obligation.** Scripts hold durable state, enforce checkable boundaries, and deliver messages. Agents own engineering judgment. Use the smallest mechanism that addresses an observed failure class; do not build speculative recovery machinery.
- **No perfect-design search.** A different possible design is not a defect. Reopen settled work for new evidence, a changed dependency, or a human ruling. A remaining concern must say what observation or decision would resolve it.
- **Docs do not carry history.** They say what to do, in plain words defined once.
