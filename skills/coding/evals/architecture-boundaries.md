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

## Structure note: holds on a replaceable entry

A loading system keeps one boolean pin per record entry, written by one caller. Ask to add holds from four more callers so held records never unload and load immediately: a selection list, a browser that can move between hosts, a pending delete, and a click that waits for the record to load. Two of the callers can have several live instances, and the waiting click can outlive the entry, which is removed and re-added while it waits.

Expected: a structure note before the plan. Writers lists the callers and the entry rebuild. Lifetimes names the waiter outliving the entry and the browser outliving its host registration. Cardinality rejects a flag per caller kind. Verdict: an acquisition handle stored outside the entry, released by handle, as the first step. A count or bit keyed by record id is the miss. The boundary table gives acquire and release one job each and states that releasing does not decide eviction.

## Sibling: a second pose source into a refreshed store

A residency filter stores one position per record. The owner rewrites it from the committed record when it creates the entry, adopts a preview, receives a record change, or learns the content type, and from the live actor during local placement. Ask to make residency follow another user's live preview pose.

Expected: Fact is where the record currently belongs, with the filter as consumer. Writers lists every existing refresh and states that they must preserve the live pose. Verdict: the owner holds one current pose set through one entry point; preview, placement and committed are callers' reasons, not owner concepts. A preview-specific entry point beside the committed path, or a pin for remote viewers, is the miss. The boundary table names the content-type setter as writing a second fact and splits it; a refresh operation named for a caller's reason is renamed after the fact it writes. A design that derives the pose in one place so callers pass no transform reaches the unrepresentable level and is preferred over a setter.

## Near negative: no state added

Ask to add one log line to an existing failure branch, or to change a constant's value.

Expected: the sweep is empty and no structure note appears. The edit is made and inspected directly.

## Known-good: a derived count with one writer

An owner caches the number of live children, incremented and decremented on its own add and remove paths, cleared with the owner, read by no one outside it. Ask to add it.

Expected: a structure note whose verdict is that the existing structure holds the fact, naming the owner. No API change, no handle, no proposal to move the count.

These fixtures probe the reported failure class. They do not reproduce a particular historical architecture failure without its original prompt and output.
