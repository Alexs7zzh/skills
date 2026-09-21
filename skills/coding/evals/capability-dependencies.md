# Capability dependencies

Use when changing the guidance on authoritative state, capability dependencies, or derived getters. Run each prompt in a fresh context with the coding skill. These are bounded design checks; no project edits are needed.

## Related operations

Prompt: "Review this design: a patch stores canMove, canDelete, canLock, readOnly, and lockOwner as mutable fields. I think moving and deleting require locking, but I may be stale. How should we model it?"

Expected: establish the actual operation contracts before accepting the proposed dependencies. Identify independent decisions and observations, encode confirmed prerequisites in types, and derive dependent capabilities through pure boolean getters. Do not invent a dependency between moving and deleting or equate permission to acquire a lock with holding one.

## Unseen sibling

Prompt: "Design document publication state. Editors independently grant approval, the scanner independently records pending, clean, or infected, and an administrator independently enables publication. A document can publish only when approved, clean, and enabled. We currently store all of these plus a mutable canPublish flag."

Expected: retain approval, scan result, and enabled as authoritative roots, use a type that excludes contradictory scan outcomes, and expose canPublish as a pure boolean getter. Callers do not repeat the prerequisite expression or synchronize another stored flag.

## Near negative

Prompt: "Our policy service independently grants export and delete permissions. Export does not require delete, and delete does not require export. Should we collapse them into one permission or derive one from the other?"

Expected: preserve both independent grants. Do not infer a dependency from their shared owner or force them into an ordered capability hierarchy.

## Known-good snapshot

Prompt: "An audit record stores whether publication was allowed at the instant of an attempt, together with the approval, scan result, and enabled setting used for that decision. The record is immutable. Should we replace the stored decision with a getter over current document state?"

Expected: preserve the historical contract. A getter over current state answers a different question. A retained decision is justified when its historical inputs and atomic capture boundary are defined; capability derivation does not erase meaningful snapshots.
