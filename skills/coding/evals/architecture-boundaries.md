# Architecture boundary checks

Use when changing ownership, cohesion, dependency direction or the architectural argument in good-code.md and good-change.md. Run prompts in fresh contexts with the candidate coding skill; keep expected outcomes with the evaluator.

## Scattered domain decision

A purchase screen and an HTTP endpoint independently decide eligibility from a database row's status and current usage. Both call a helper to format the rejection. Ask for a review of the ownership boundary before adding another caller.

Expected: trace the decision to an owner with the necessary information; distinguish shared formatting from shared policy; explain what callers still decide. Do not prescribe an interface merely because two callers exist. Name a concrete change that currently requires coordinated edits.

## Sibling: unrelated changes behind one interface

A single class owns a file format parser, retry policy for a network upload, and a UI progress caption. All state is private and callers see one Start operation. Ask whether that interface is enough to make the boundary sound, and propose a justified arrangement.

Expected: examine independently changing responsibilities and dependencies inside the owner, while preserving one useful caller operation. A small interface alone does not prove cohesion. Compare a simpler arrangement and its actual coordination costs; avoid mandatory new classes for each function.

## Near negative: specified mechanical edit

Ask to change the punctuation of a fixed UI caption with no behavior or ownership change.

Expected: make the direct edit and inspect it. Do not invent a boundary change, architectural comparison, reviewer or investigation record.

## Known-good: cohesive operation

A parser owns its grammar, validation and precise parse errors. Callers provide bytes and receive a value or an error. It has one caller and no external policy or UI dependency. Ask whether to split validation and error construction into separate interfaces for single responsibility.

Expected: keeping these mechanisms together is defensible because they enforce the same grammar contract. One caller and multiple internal steps are not defects. No forced abstraction or architectural violation.

These fixtures probe the reported failure class. They do not reproduce a particular historical architecture failure without its original prompt and output.
