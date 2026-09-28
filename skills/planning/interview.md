# Interview

## Feature decision pass

Before assessing, proposing a route for, or changing solution-shaped issues for a nontrivial feature, fill in and show the seven labeled slots below in the final user-facing response. Give each a concrete answer, or say why it does not apply; intermediate notes and a summary paragraph do not replace the slots. Keep the issue bodies focused on the resulting decisions, not this worksheet.

1. **Outcome and first case:** List distinct user-visible cases separately, including first use, a fresh join, or empty data where relevant. What is only a proposed mechanism?
2. **Facts and premises:** Which actor has each required fact, at what time, and from what source? Mark what is observed, inferred, or unknown. What happens when the fact is missing?
3. **Necessary work:** For each proposed prerequisite, remove it mentally and name the resulting failure for each user case. Separate what must precede the next useful step from work that can wait or remain partial. If partial coverage still improves one case, show that staged option and its accepted gap.
4. **Routes:** Give materially different viable paths when the approach is open, including a small reversible way to learn and a more complete path where relevant. In a feature-plan review, compare a committed route with a different viable path when coverage, cost, reversibility, or risk changes; label it as a proposed revisit, not a replacement for a human ruling. State what each delivers, misses, costs, and which priority would favor it. If no other route is credible, say why.
5. **Proof and failure:** Name the product's reference for correctness, the comparisons or observations that test it, and the coverage count needed to interpret a clean result. For derived data copied across machines or persisted, check independent producers against each other and against the runtime reference before durable writes when an observation-only stage is possible. Say where a mismatch or failure is detected and what happens next.
6. **Release and impact:** Name the first reversible step, the gate before wider use, and how to back out. Check plausible scale, latency, memory, or load changes. If a threshold increases work, compare real-world counts and cost with the current baseline before enabling it by default; answer whether an opt-in or adjustable threshold is warranted, with a reason.
7. **Work boundary:** Name the smallest independently verifiable next outcome, its actual blockers, and later work that depends on evidence or a human decision. Give user cases separate work boundaries when their risks or proof differ.

Do not force multiple routes in routine execution of settled work. A review can show the user another tradeoff without overriding the settled choice. For a small maintenance edit with no disputed premise, skip this pass and make the edit.

1. Establish the outcome or decision being explored and the scope the user brought. For an existing backlog, inspect its open work, completion claims, proposed designs, and future ideas. Check existing code and task records for overlap. Do not assume every old item is still wanted. Identify terms whose plausible meanings produce different outcomes. For each consequential ambiguity, state a concrete scenario showing the difference and ask which behavior is intended; do not turn harmless synonyms into a terminology exercise. Code can expose a mismatch without deciding the desired behavior. Before the first round, check the user's uncertain factual claims and the discoverable facts (platform support, existing code paths, prior measurements) and open the round with those results; the questions that remain are the ones evidence cannot answer.
2. Arrange unresolved choices by their prerequisites. The frontier contains questions whose prerequisites are settled. Ask those together in a round; a question depending on another unanswered question belongs to a later round. A fact still under investigation leaves only its dependent questions waiting.
3. For each question, give a stable number, the concrete user consequence, alternatives where they help, and your recommendation with its reason. Separate the recommendation from the user's answer. Wait for answers; do not simulate the user's decisions.
4. Update the settled decisions and recompute the frontier from the answers and new facts. Carry unanswered questions forward. Preserve an agreed definition in the project's existing goals or domain documentation only when future decisions need that distinction, with its scope and ruling source. Otherwise keep it in working context. Do not introduce a mandatory glossary or ADR system. Do not repeatedly ask settled questions unless new evidence or a changed goal warrants reopening them.

In a requested grilling session, work through the in-scope decision branches without a fixed question limit. Do not drop valid questions merely because earlier questions were more valuable. Routine engineering choices remain yours under the shared rules. Record deliberately deferred or excluded branches explicitly; postponement is not an answer. The user may narrow the scope or stop the interview.

For ordinary scoping, resolve enough intent for the next useful work. Unknown behavior can become an investigation or candidate implementation instead of another hypothetical interview round. A request for full grilling chooses deeper coverage; a request for a brief does not choose grilling.

## Close the discussion

Return an inspectable account of:

- Settled outcome and scope, with human rulings distinguishable from recommendations.
- Remaining questions, deferred or excluded branches, and what would resolve the open ones.
- Work now possible and the uncertainties that still block other work.

For a full grilling session, unresolved in-scope questions remain visible until answered, explicitly deferred, or removed by a scope decision. Do not report complete agreement while answering the user's side yourself. Use the brief or map method only if the requested next action needs it.
