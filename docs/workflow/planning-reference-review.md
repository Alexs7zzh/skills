# Planning reference review

Development analysis of the local Matt Pocock reference snapshot. These are recommendations, not adopted skill rules or measured claims about model behavior. Runtime skills must not depend on this file or the reference tree.

## How value is judged

Separate the value of an activity from the value of its skill instructions. Research can be essential while a three-step research wrapper adds little to this workflow. Compare each reference with the current planning and coding skills, not with an agent given no context. A high-value mechanism changes a recurring decision, interaction, or output that matters to the user.

Workflow positions below are conditions for use, not mandatory phases. Research, domain clarification, prototypes, and architectural work can recur during implementation as new constraints appear.

| Reference | Main incentive | Workflow position | Optionality | Added instruction value for this workspace | Recommendation |
|---|---|---|---|---|---|
| codebase-design | Reduce what callers must know and concentrate change behind useful interfaces | Architecture, implementation, refactoring, review | Conditional design lens; no separate gate | Substantial technical content, but strong overlap with coding and some conflicting absolutes | Keep coding ownership; do not import wholesale into planning |
| domain-modeling | Expose false agreement hidden in ambiguous terms and relationships | Interview, design, and revisiting behavior discovered in code | Use when ambiguity changes behavior; no glossary ceremony for every feature | Useful mechanism missing from planning's generic grounding rule | Candidate for targeted interview behavior; persistence preference unresolved |
| prototype | Let the user discover a wrong idea through a concrete artifact | Before or during implementation when discussion is insufficient | Fully optional; candidate implementation can itself answer the question | High specificity in supporting files; the presentation mechanics carry most of the value | Keep as optional capability candidate, independently useful beyond planning |
| research | Ground uncertain facts in sources while preserving the main agent's attention | Wherever an external fact blocks a choice | Activity is sometimes necessary; dedicated skill/background agent is optional | Small incremental value over current evidence and tool behavior | No separate wrapper now; preserve source/evidence principles |
| wayfinder | Resume and navigate an incomplete decision graph across sessions | Large uncertain efforts and ongoing discovery | Unnecessary when the work is small and the route clear | Strong coordination structure; much is already adapted in map.md | Keep core map behavior; consider clearer treatment of unspecified work |
| to-tickets | Make work independently actionable and verifiable with real prerequisites | Once some work can be stated clearly, and when splitting/revising it later | Multiple tickets unnecessary for one bounded task | Strong output contract; most already adapted in map.md | Keep as map method; no separate skill needed |
| to-spec | Preserve an established conversation as a usable handoff | When synthesis helps continuation or review | Optional; discussion can go directly to issues or implementation | Useful synthesis boundary; extensive template conflicts with desired memory and attention policy | Keep brief method, skip exhaustive template and forced checkpoints |

## Codebase design

Source: `references/mattpocock-skills/engineering/codebase-design/`, including `DEEPENING.md` and `DESIGN-IT-TWICE.md`.

The desired outcome is an interface that hides useful complexity and lets callers, maintainers, and tests work locally. The skill counters scattered orchestration and abstractions whose callers still need to understand the implementation. It provides a glossary, a deletion test, dependency categories, testing advice, and a procedure for comparing alternative interfaces.

The strongest idea is the broad definition of interface: all facts a caller must know, including ordering, errors, configuration, and performance, not just method signatures. The deletion test asks where responsibility would go if the abstraction disappeared. These improve the question being asked during design.

Our coding skill already covers caller knowledge, sequencing, recovery, deletion tests, and total subsystem complexity. These rules belong there because they also govern diagnosis and review. Planning can identify a design investigation without embedding another architectural doctrine.

Do not copy the rigid ban on ordinary synonyms, mandatory adapter counts, or reducing method counts as a general optimization target. A useful boundary can exist with one current implementation. A smaller signature can conceal more obligations. The supporting file's instruction to delete old unit tests once interface tests exist needs evidence that required coverage survives, not a universal deletion rule.

Alternative-interface comparison remains a possible coding technique for a consequential unresolved design. The fixed three-plus agents and prompts to maximize flexibility can add speculative scope. They are not necessary planning machinery.

## Domain modeling

Source: `references/mattpocock-skills/engineering/domain-modeling/`, including glossary and ADR formats.

The goal is shared, precise meaning. The incentive is to stop apparent agreement around words such as account, purchase, cancellation, or access from hiding different intended behavior. The skill actively challenges overloaded terms, creates counterexample scenarios, checks assertions against code, and records resolved definitions.

For the payment review, a useful question might distinguish provider payment confirmation, order fulfillment, and download entitlement. The reason to separate them is the behavior during delays, refunds, or retries; it is not merely vocabulary consistency.

This is stronger than an instruction to read a glossary. Our planning interview has dependency-aware questions but no explicit mechanism for testing whether the same term denotes different states or actors. A targeted scenario-based instruction could earn its place there. Code inspection should reveal disagreement, not automatically overrule the user's desired behavior.

The reference's ADR gate is narrower than it first appears: meaningful reversal cost, a surprising choice, and a real tradeoff must all be present. That restraint is useful. But we should not require an ADR hierarchy or use the reversal-cost test to discard a user priority that deserves durable preservation even if its implementation is easy to change.

Adopted adaptation: challenge an ambiguity when its interpretations produce different outcomes, explain the difference through a scenario, and preserve the agreed meaning only where future decisions need it. The user chose existing goals/domain documentation for consequential definitions, with no mandatory glossary or ADR system. The fixed `CONTEXT.md` layout and immediate file write for each term are not required.

## Prototype

Source: `references/mattpocock-skills/engineering/prototype/`, including `LOGIC.md` and `UI.md`.

The goal is to answer a design question through an artifact the user can operate or compare. Its incentive is to avoid long speculative discussion and to reveal problems in the idea before treating a design as settled.

The logic branch creates a self-contained HTML demo with visible state, free actions, and guided scenarios. The UI branch creates structurally different variants in the real page context with a shared switcher. These prescriptions make the user's inspection concrete; they account for substantially more value than the generic request to prototype.

This activity can happen during planning or after a real implementation exposes an uncertain choice. It is not a prerequisite to implementation. The user's shipping-quality but replaceable candidate is also different from this reference's deliberately low-fidelity code with minimal error handling and no tests.

Candidate mechanisms to retain: state the question visibly, choose fidelity that can answer it, expose the relevant state, use realistic page context, and make alternatives meaningfully different. Record what the artifact establishes and what it cannot establish. A browser simulation of payment events does not verify provider behavior, concurrency, or production performance.

Do not copy universal no-tests rules, default three variants, fixed HTML for every logic problem, or mandatory Git branches for retention. Once experimental logic becomes a production candidate, the coding workflow's validation applies. Retain working artifacts while useful, without turning every prototype into permanent architectural authority.

Keep an optional prototype capability as a candidate. Its artifact construction is independently useful and need not live inside planning. Whether planning should suggest or autonomously produce such an artifact is awaiting user preference.

## Research

Source: `references/mattpocock-skills/engineering/research/SKILL.md`.

The skill delegates reading to a background agent, requires primary sources, and writes cited findings to a Markdown file. Its incentive is to keep the main context available for judgment while preserving reusable findings.

The research activity is necessary whenever a decision relies on an unknown external fact. The incremental instructions are modest in this environment: source ownership, evidence, and background independent work are already covered elsewhere. A dedicated file also adds little when a short sourced answer in the owning issue would suffice.

Keep research as a possible investigation in the map. Do not add a separate skill merely to wrap delegation and file writing. Consider one later if real runs show recurring source-quality, synthesis, or provenance failures that need a stronger method. A technical probe against real code may answer a question that documentation alone cannot.

## Wayfinder

Source: `references/mattpocock-skills/engineering/wayfinder/SKILL.md`.

The goal is continuity and orientation in work too uncertain or large for one session. Its incentive is to avoid both a giant prematurely detailed plan and repeated discovery at every restart. It treats the map as an index, distinguishes decisions from implementation tasks, queries the available frontier, and expands only the newly visible work.

The reference's default endpoint is a clear route with decisions resolved, rather than a finished feature. Our map deliberately allows decisions, investigations, and implementation to interleave, consistent with learning from code.

Already adapted: incomplete maps, real blocking relationships, named task links, decision versus implementation completion, project-configured storage, and updating affected work after a discovery.

A useful distinction worth retaining explicitly is between an unknown answer and an unformulated question. A precise question can be ticketed while blocked. In-scope work that cannot yet be framed belongs in a loose map note. Out-of-scope work should not silently become future work. Our map mentions vague future work, but does not state this full three-way distinction as sharply.

Do not copy one-ticket-per-session limits, fixed token sizing, mandatory grilling/domain-modeling calls, or an assumption that every research result belongs on a Git branch. The reference uses assignment as a claim; that alone is not evidence of exclusive ownership across concurrent agents. If concurrent task claiming becomes a real need, solve it with the project's actual coordination tools rather than adding an untested convention.

## To tickets

Source: `references/mattpocock-skills/engineering/to-tickets/SKILL.md`.

The goal is work an agent can take and verify without re-deriving the entire plan. It counters layer-by-layer lists that complete code fragments without delivering behavior. Explicit completion conditions and blocker relationships are its strongest contributions.

Most of this is already in map.md: outcome-oriented tasks, real edges, existing task context, native relationships where available, and explicit treatment of migrations. Spec production is not a prerequisite.

Do not copy unconditional prefactoring, universal context-window sizing, fixed local directory layouts, or marking every generated ticket ready for an agent. Actual prerequisites and human choices still determine readiness. Review the breakdown with the user when requested or needed for consequential scope decisions; do not insert an extra approval round after a clear instruction to publish established work.

The reference's blanket instruction never to modify the parent would conflict with maintaining an accurate map after obligations move. Preserve parent scope and transferred obligations according to the requested change.

## To spec

Source: `references/mattpocock-skills/engineering/to-spec/SKILL.md`.

The goal is synthesis of an established discussion into something another session can use. The instruction not to restart interviewing is useful, as is separating desired behavior from implementation and testing decisions.

The file nevertheless requests a user check on test seams before writing and publishing. It also asks for extremely extensive user stories and favors the fewest possible testing seams. These are additional workflow and architecture choices, not inherent requirements of synthesis.

Our brief method already preserves the useful part: outcome, explicit rulings, acceptance, evidence, provisional approach, and unresolved dependencies. It does not turn every implementation detail into a human decision or require publication without that action being requested.

Keep acceptance scenarios that distinguish success. Skip exhaustive story expansion, a universal ideal of one test seam, automatic ready labeling, and a permanent spec as the intermediate authority. A temporary brief earns its place when it reduces loss at a handoff or makes the user's decision inspectable.

## Proposed disposition

- Keep the already adapted wayfinder, to-tickets, and to-spec mechanisms in planning. Their current ownership is map.md and brief.md.
- Added the user-authorized domain-clarification mechanism in interview.md and distinction between blocked questions, unspecified scope, and excluded scope in map.md.
- Keep interactive prototyping and alternative-interface comparison as conditional capability candidates. Their value should be tested on a real use, not assumed to justify mandatory stages.
- Leave architectural judgment and technical evidence with coding. Do not create a thin research wrapper or duplicate codebase-design inside planning.
- The user also requested a local copy of ShowMe. Its SKILL.md is copied unchanged into skills/show-me/, with workspace goal and manifest files. Broader prototype automation remains undecided. References stay unchanged.
