# Design from zero

Input for a group designer: the orientation, its sections of the model, the K rows, the goals and rulings, and [lenses.md](lenses.md); it looks up any other row an invariant cites by id. Input for the integrator: the group files, the orientation, the K rows and the goals; it looks up rows by id. Nobody at this stage reads the whole model. You do not receive the source and you do not open it. When you need a fact the model lacks, write it as a premise and continue. A refuted premise is a design defect that the revision repairs.

Design the structure under which each K row cannot be written, or is refused at one gate. Use roles, not the model's symbol names. Then compare sees where the code differs, not where it matches by name. Honor each lens's "Not a finding" line: do not encode against a combination the model shows excluded.

## Two passes

**Group designers.** One designer per section group writes `design-<group>.md`. It designs for the rows of its own sections and the K rows that cite them, using the component roles the orientation names; it adds a role only with a reason, and the integrator keeps or merges it. Its file has Invariants, Encoding, and Premises and runtime checks. A need on another group's sections is one line: `needs: <what>, from <group>`. It does not design that part.

**Integrator.** One integrator reads every group file, the orientation and the K rows, looks up model rows by id, and writes `design.md`. It merges the invariants, renumbers the I, E and P ids, answers each `needs` line, resolves conflicts between groups, and writes Structure, Constraints honored, Conflicts resolved, Collapses and Lenses used. It runs the shapes check on every encoding and rewrites or drops one that matches a shape.

Check a group file with `python3 scripts/check_artifacts.py design <file> --model <model.md> --lenses <lenses.md> --group`. Check `design.md` without `--group`.

## Sections

Write these sections with these headings, in this order. The integrator writes all of them; a group designer writes the three marked (group).

**Invariants** (group). A table with one `I` row per invariant, drawn from the K rows and from the model's exclusive roots, gates, lifetimes, identities and failure distinctions. Columns: the invariant, the model rows that establish it by id, the lens slug. A group with no invariant writes `none, because <reason>`.

**Encoding** (group). One `### E<n>` per encoding, with these slots, each on its own line. A group with nothing to encode writes `none, because <reason>` under the heading.

- **Invariant:** the `I` ids it enforces.
- **Owner:** the component, by role, that holds it.
- **Member:** the kind of code form: a type, a field private to its owner with a getter, one method, an override of a named provider routine, a sum type, a scoped owner.
- **Performs:** the actions it carries out, in order where order matters.
- **Refuses:** the actions and writers it keeps out, and where the refusal sits relative to the write, by the gate definition in SKILL.md's Terms.
- **Replaces:** the provider routines it overrides, forks or no longer calls, by `PR` id, or `none, because <reason>`.
- **Removes:** the behavior the form takes away from the current path, and what then bounds the quantity that behavior governed, or `none, because <reason>`. A removed corrective step leaves the value it corrected unbounded until the next input. Name the new bound with a proposed value and its basis from the model's rows; synthesis lists the value as a default taken. A bound left to "a later decision" is not an encoding.
- **Level:** `unrepresentable by type`, `refused at one gate` or `runtime check`, with the reason. A runtime check names why the stronger level is unavailable.
- **Premises:** the `P` ids it rests on, or `none, because <reason>`.

These slots make an encoding refutable. An invariant restated in the voice of enforcement ("the owner refuses the forbidden write", "one operation orders the effects") fills none of them. Compare returns it as a defect. When the form rests on provider behavior the model does not record, such as what a setter's entry routine writes or what a helper does when its input is absent, write the premise and commit to the form. An uncommitted form is not checkable.

**Structure.** The components by role: the state each owns, the actions it exposes per state, the resources it owns and releases, the identities it mints and checks, the failures it classifies. The external adapter and what crosses it in each direction. The interrupting events and the one place that orders teardown. Keep pseudocode language-neutral unless the project language is given.

**Constraints honored.** How the structure meets the goals, the rulings and the performance or memory constraints the orientation states. Ownership of each resource follows the lifetime lens.

**Premises and runtime checks** (group). A table of `P` rows: each claim about external behavior that the model does not state, with the model row it would extend. At least one encoding cites each premise. Then the checks that stay at runtime because an external party can violate them, each with the check that catches it.

**Conflicts resolved.** One line per place where two group designs claimed the same state, action or resource, with the resolution, or `none, because <reason>`.

**Collapses.** One line per `K` row of the model: the `I` id that answers it, or `not encoded, because <reason>`.

**Lenses used.** Which lenses produced which structure. A lens that produced nothing is listed as unused.

## Limits

Do not restate the model. Do not pick a framework or library; name the form and let the project choose the idiom. Do not design beyond the model's boundary. Prefer the structure that removes the bug class with the fewest new concepts. The smallest design has the fewest places where a mistake is still possible, not the fewest lines.

Finish when every `K` row is answered, no encoding matches a shape in [Checking a design](lenses.md#checking-a-design), and the check passes.
