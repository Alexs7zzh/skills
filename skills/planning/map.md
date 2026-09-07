# Work map

## Establish the map

Read the destination outcome. When working from an existing map or backlog, read its current task records, relevant closed work and discussions; reuse matching work. A draft in chat can use sufficient supplied context without configuring a tracker. Before resolving task identifiers or storing work, read the project's tracker instructions for storage, relationships, and queries; discover provider commands from the actual tools rather than assuming GitHub or Git.

Group coherent outcomes with parent/child relationships where useful. Create actionable records for decisions, investigations, or verifiable changes. A question resolves with an answer and evidence or a human ruling; an implementation resolves with working behavior and validation. Do not call an implementation complete because its design question was answered.

Each actionable record contains:

- An understandable title and the outcome, question, or behavior it addresses.
- Scope and an observable completion condition.
- Relevant rulings, evidence, and consequential assumptions, usually by link.
- Real blockers and why their result is necessary, or an explicit statement that none are known.

Prefer changes that deliver a verifiable behavior across the necessary layers. Do not mechanically split by database, API, and UI. Migrations may need compatibility steps and caller batches; each unit must name where it can be verified.

Place unresolved work by what is known:

- **Defined question, unknown answer.** Create an actionable record even if blocked; name the prerequisite needed to answer it.
- **In scope, question not yet clear.** Keep a loose note in the owning map, including what discovery could make it specific. Turn it into tasks when the questions become clear, removing the replaced note rather than duplicating it.
- **Out of scope.** Record the exclusion and its reason. Do not let it enter ready work unless the scope is explicitly changed. Being vague or difficult does not make wanted work out of scope.

## Express dependencies

An edge means the dependent work needs the predecessor's result. Common files, priority, parentage, and milestone order do not establish that necessity. Distinguish resource contention from a logical prerequisite.

Use native blocking relationships when the tracker supports them; otherwise record explicit blockers by stable identifier. For local storage, use the project's file convention. Milestones group release or other checkpoints. Parent/child relationships group scope. Neither replaces blocking edges.

Check for cycles. A cycle may expose an unresolved shared decision, a unit that must be developed together, or an incorrect edge. Resolve the cause rather than assigning arbitrary order. Ready work has its real prerequisites satisfied and no unresolved decision blocking its scope; if claims or prerequisites are unverified, say so.

Show the outcome at low detail, the decisions needing the user, and work ready to take. Use names with links rather than a wall of identifiers. Provide a dependency diagram when it helps inspect the relationships; do not require a diagram for a simple list of independent tasks.

## Write and maintain

Draft or publish to the authorized destination. After writing, read back the task bodies and relationships to verify the intended graph. Report what was saved, what is ready, and unresolved blockers. If a provider operation fails, preserve the successful identities and remaining operations so retrying does not duplicate tasks.

When a decision or discovery changes the map, update affected records and edges. Add newly clear work, merge duplicates, and mark superseded or dropped work with its disposition. Do not restart the whole map, silently expand scope, or predefine distant work merely to fill it out.

When splitting a task, transfer each remaining obligation and dependent relationship to the appropriate records. Keep one owning record per obligation. Recompute ready work after changes; an old ready label is not proof that current prerequisites are satisfied.

## Replacing an existing backlog

Keep a temporary source-to-destination accounting for retained or merged work, supported completion claims, user-dropped or deferred work, and durable intent moved elsewhere. Unknown status remains unknown or becomes an investigation. Do not treat old prose as a human ruling without its source.

Verify destinations and relationships before retiring source material. Update project instructions and live pointers so future agents use the new tracker. Apply the shared retention rules; the migration accounting need not become another permanent backlog.
