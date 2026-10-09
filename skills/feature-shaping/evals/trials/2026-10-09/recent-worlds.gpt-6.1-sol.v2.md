## 1. Outcome

People can recognize a world they enjoyed and return without remembering its name or searching again.

## 2. Verdict on the proposal

**Partly delivers.** It’s a reasonable small feature to test, but there’s no evidence yet that returning to worlds is a major home-screen need. Five recent worlds helps the common case; it misses the **sixth-world** case and can disappoint in the **unavailable-world** case.

## 3. Proposal

“Recently visited” on home: **up to five distinct worlds successfully entered, most recent first**. Revisiting a world moves it to the front; failed entry attempts don’t count. Show recognizable names and thumbnails, with the existing world-entry action.

Keep five as your proposed constraint, pending evidence. Measure how often people successfully return through the list, and how often they search for previously visited worlds outside it. Those observations should determine whether five is enough.

When a world is known to be unavailable, explain that on its entry. History must never promise continued access. If history cannot load, the rest of home should remain usable; hide the section when history is empty.

Pre-mortem risks: frequent hopping pushes desired worlds out (**sixth-world**); similar thumbnails cause mistaken selections (**lookalikes**); stale availability wastes an entry attempt (**unavailable-world**); the section displaces more useful home actions (**crowded-home**).

## 4. Decisions for the user

- **Priority order, assumed:** I rank inability to find a world above a failed return attempt, and both above extra searching. If failed attempts are more frustrating, availability handling deserves priority over expanding history.
- **Five versus broader history:** retain five for a small initial feature; expand only if older-world retrieval is a demonstrated need. This report doesn’t overturn your five-world constraint.
- **Home placement:** keep it if returning is frequent; use a smaller last-world shortcut if that covers most returns; deprioritize it if another home action matters more.
- **Adjacent outcome:** returning to a world and rejoining the same friends or live session are different promises. The latter would require separate shaping.
- **Unverified:** existing search, history persistence, world metadata and availability signals. No checkout or usage evidence was supplied; the measurements below are proposed instrumentation, not confirmed capabilities.

## 5. Idea chain

| Step | Problem it answered | Evidence | Control introduced |
| --- | --- | --- | --- |
| Home recents | Finding visited worlds again | *Claimed*; inferred from request | Home placement, five, newest first — user proposal/rulings |

## 6. Experience ladder

| Rung, worst first | Scenario | Reason for position |
| --- | --- | --- |
| R1: Cannot find desired world | Desired world is sixth | Retrieval blocked; order *assumed* |
| R2: Misleading or failed return | World unavailable or misrecognized | Wasted attempt; order *assumed* |
| R3: Extra effort | Manual lookup; crowded home | Recoverable friction; order *assumed* |
| R4: Easy return | Recognizes recent world, enters | Intended outcome |

## 7. Scenario table

Predictions, not observed results. “Existing lookup” assumes another retrieval route exists.

| Scenario | Original list | Do nothing | Reshaped list | Smaller: last-world shortcut |
| --- | --- | --- | --- | --- |
| Common: return to latest world | R4: easy return | R3: existing lookup | R4: easy return | R4: easy return |
| Sixth-world: rapid hopping | R1: absent | R3/R1: lookup dependent | R1: absent | R1: absent |
| Failed entry attempt | R2 if recorded | R3: existing lookup | R4: successful visits retained | R4 if successful visits only |
| Unavailable-world | R2: failed attempt | R2 on entry | R2; explained when known | R2: failed attempt |
| Lookalikes | R2: wrong selection | R3: lookup | R2 risk remains | R2 risk remains |
| Crowded-home: small display | R3: displaced actions | No added friction | R3 risk remains | Less displacement |
| History unavailable | Unspecified | Existing home works | R3: existing home works | R3: existing home works |
| **Contention** | Home space; priority unspecified | Existing content keeps space | Home space; priority needs evidence | Less space used |
| **Settings cost** | None needed | None | None; product chooses count | None |
| **Failure contract** | Unspecified | Existing behavior | Home works; entry rules apply | Home works; entry rules apply |

## 8. Measurement

| Control / quantity | Protects | Classification and divergence | Source |
| --- | --- | --- | --- |
| Home placement | R3 | **Proxy** for discoverability; crowds other actions | User request; scenario reasoning |
| Five-world limit | R1 | **Proxy** for desired-world coverage; sixth-world fails | User request |
| Most recent first | R3 | **Proxy** for return intent; favorite may be older | User request |
| Successful entry flag | R2 | **Direct** arrival event; enjoyment remains unknown | Proposed app event; unverified |
| Distinct world ID | R1 | **Direct** deduplication; repeated visits use one slot | Proposed history records; unverified |
| Name and thumbnail | R2 | **Proxy** for recognition; lookalikes diverge | Proposed presentation |
| Known availability | R2 | **Direct** at entry check; earlier status can stale | Proposed entry result; unverified |
| Empty/error visibility flag | R3 | **Direct** history state; preserves usable home | Proposed history-load result |
| Successful return rate | R4 | **Direct** entry completion; satisfaction remains unknown | Proposed click-to-entry events |
| Desire to return | R1–R4 | **Unmeasurable directly**; behavior and reports approximate it | General product reasoning |