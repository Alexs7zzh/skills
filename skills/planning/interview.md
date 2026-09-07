# Interview

1. Establish the outcome or decision being explored and the scope the user brought. For an existing backlog, inspect its open work, completion claims, proposed designs, and future ideas. Check existing code and task records for overlap. Do not assume every old item is still wanted. Identify terms whose plausible meanings produce different outcomes. For each consequential ambiguity, state a concrete scenario showing the difference and ask which behavior is intended; do not turn harmless synonyms into a terminology exercise. Code can expose a mismatch without deciding the desired behavior.
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
