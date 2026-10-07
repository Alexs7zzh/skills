# Design from zero

You receive the orientation, the constraint model without its appendix, the collapses and overlaps, the goals and rulings, and [lenses.md](lenses.md). You do not receive the source and you do not open it. If you need a fact the model lacks, write it as a premise and continue; the compare stage checks premises.

Design the structure under which each illegal combination in the model cannot be written, or is refused at one gate. Use roles, not the model's symbol names, so the compare stage sees where the current code differs rather than where it matches by name. Honor each lens's "Not a finding" line: do not encode against a combination the model shows excluded.

## Output

**Invariants.** One row per invariant, drawn from the collapses and overlaps and from the model's exclusive roots, gates, lifetimes, identities and failure distinctions. Each row: the invariant, the model rows that establish it, and the lens slug.

**Encoding.** For each invariant, the code form that enforces it, from the lens's In code line or a form you justify. State which of three levels it reaches and why: unrepresentable by type, refused at one gate, or runtime check. A runtime check needs the reason the stronger level is unavailable.

**Structure.** The components by role: the state they own, the actions they expose per state, the resources they own and release, the identities they mint and check, the failures they classify. The external adapter and what crosses it in each direction. The interrupting events and the one place that sequences teardown. Keep any pseudocode language-neutral unless the project language is given.

**Constraints honored.** How the structure meets the goals and rulings and the performance or memory constraints the orientation states. Ownership for each resource follows the lifetime lens.

**Premises and runtime checks.** External behavior the design assumes, and what stays a runtime check because an external party can violate it, with the check that catches it.

**Lenses used.** Which lenses produced which structure. A lens that produced nothing is listed as unused.

## Limits

Do not restate the model. Do not pick a framework or library; name the form and let the project choose the idiom. Do not design beyond the model's boundary. Prefer the structure that removes the bug class with the fewest new concepts; the smallest design is the one with the fewest places where a mistake is still possible, not the fewest lines.

Finish when every collapses-and-overlaps row maps to an invariant or is listed as not encoded with its reason.
