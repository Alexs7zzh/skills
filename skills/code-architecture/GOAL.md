# Goal

Read before discussing or changing this skill.

## Why

Architecture work needs attention separate from implementing the next change. This explicitly invoked skill builds a source-grounded account of a subsystem so independent reviewers can challenge its boundaries without rediscovering its behavior or inheriting the implementer's assumptions.

The workflow separates factual research, independent architecture judgment and a concrete implementation handoff. Run the stages the user requests. Research alone does not authorize review or project edits; a review produces recommendations, while implementation needs the user's request to change the code.

## Values

- **Organize evidence for the principle reviewer.** Each principle has a focused section containing the facts and relationships needed to judge it. A reviewer should not reconstruct its argument by searching the whole account. Keep shared facts consistent, but include the local explanation each section needs; a pointer alone is not that explanation.
- **Make required actions explicit.** State the research steps, required outputs and stopping criteria. Leave evidence selection to the researcher within those boundaries; do not make the researcher guess which artifact to produce or what counts as completion. Compare small, equivalent trials when choosing between instruction versions.
- **Explain mechanisms a designer can use.** Connect user actions to decisions, state, execution contexts, external boundaries and outcomes. A list of classes or API names is not an explanation.
- **Facts survive handoff.** Each consequential claim has evidence tied to a source revision. Source behavior, provider guarantees, measured observations and unknowns remain distinguishable. A timeout does not prove cancellation; an asynchronous completion does not prove a nonblocking call.
- **Separate attention by responsibility.** A research lead integrates the account and owns connections and conflicting facts. For review, a whole-account reviewer connects boundaries while independent principle reviewers inspect their selected questions. Reviewers receive factual research without a design verdict or peer findings. One synthesis merges mechanisms and develops the implementation handoff.
- **Spend work once at its owner.** Research establishes facts; review trusts that account and resolves only consequential gaps or contradictions. Hashes and source links establish provenance, not narrative completeness. Do not repeat discovery in every reviewer or spend a worker slot merely waiting on others.
- **Findings lead to a concrete choice.** Distinguish local mistakes from structural causes. Select the smallest sufficient remedy, including an existing abstraction when it prevents the demonstrated failure class. State affected paths, useful verification and the exact missing decision or evidence. A new framework is not a requirement and an evidence gap is not automatically a defect.
- **Durability follows understood constraints.** Seek boundaries that stay stable while their requirements and external contracts hold. New evidence or changed requirements can justify revisiting them; no report certifies an architecture permanently finished.
- **Bounded coverage, explicit gaps.** Explain the requested subsystem and the neighboring contracts needed to understand it. Cover consequential boundary operations and transitions; do not turn the report into a repository dump or treat an uninspected area as clean.

## Maintenance

Test instructions in a fresh researcher context. Preserve the prompt, exact skill version, report and observed miss. Use a different subsystem to check that a repair generalizes. Stop a live trial when a meaningful instruction failure is established, preserve its partial work, and repair the skill before continuing the trial. Project edits and runtime experiments need their own task authority.
