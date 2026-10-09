# Feature shaping: "Recently visited worlds" on the home screen

Scope note: I had no project checkout, so this is based only on the request and general knowledge. No codebase or tracker was searched. Every claim about what the product can measure is marked unverified in Decisions.

## 1. Outcome

When someone opens the app, they can get back with one tap to a place they cared about, or to the people they just lost. Nothing on the home screen shows others where they have been unless they want it to.

## 2. Idea chain

There is no history behind this request, so the chain is the proposal plus the two things it leaves unstated.

| Step | Problem it answered | Evidence for that problem | Control it introduced |
| --- | --- | --- | --- |
| Proposal: recents row on home | Users have to search or remember names to return to worlds they were in | None given (assumed from the request) | Count = 5 (ruling); order = most recent first (ruling); placement = home screen (ruling) |
| Implicit: what counts as a visit | Not stated | None | Visit = any world join (design choice by default) |
| Implicit: where history lives | Not stated | None | Storage scope: device or account (unspecified) |

The count, order and placement come from the user, so they are rulings. The user is also asking whether they are right, so the premises behind them are open and go to Decisions where a scenario overturns them.

## 3. Experience ladder (worst first)

| Rung | Scenario | Why it sits above the next rung |
| --- | --- | --- |
| R1 Exposed history *(assumed)* | A streamer opens the home screen live, or a family member picks up the shared headset, and sees a world the user did not want seen | Once seen, it cannot be taken back (reputation, safety). Every rung below costs time or one evening |
| R2 Lost session with people *(assumed)* | The client crashes or drops mid-hangout. On relaunch, the user can't get back to the same instance, and the friends are elsewhere | Friends are waiting now and the evening ends. R3's world can still turn up through search or a friend |
| R3 Lost place | During an event crawl the user visits eight worlds, loves the second one and can't remember its name | It is a permanent loss, unlike the one-off emotional cost in R4 |
| R4 Unwanted reminder | The user left a world after ten seconds because it was hostile or upsetting, and it now sits first on their home screen | It costs feeling as well as time, so it ranks above a dead tap |
| R5 Dead tap | The user taps a recent world that has since been deleted, made private or banned for them, waits, and gets an error | Waiting and then failing is worse than a slower path that works |
| R6 Repeated friction | The world the user visits every day dropped off after five other visits, or the slots are filled with the hub or tutorial, or the second device shows an empty list. They search again | A small cost, but it repeats every session |
| R7 Wasted home space | A new user sees an empty row, or the row pushes events and discovery further down | The lowest cost: a little less to do on the screen, with nothing lost |

## 4. Verdict on the proposal

**It partly delivers.** It handles the common case (S0) and nothing else cleanly:
- It misses S1 (R2): rejoining lands in the world, probably not the same instance (unverified). It also misses the session entirely if a visit is recorded only on a clean leave.
- It misses S2 (R3): five slots overflow in a single evening.
- It misses S3 and S8 (R6): hub and tutorial repeats fill the slots, and a daily world drops off.
- It misses S4 (R4): the world the user fled lands at the top.
- It misses S5 (R1): nothing hides the list.
- It misses S6 (R5): removed worlds stay as dead taps.
- On S7 (R6), the result depends on the storage it never specifies.

## 5. Proposal (reshaped, option C)

**Change: "Jump back in" row on the home screen**
- **Recording.** A history entry is written when the user joins a world, not when they leave, and dwell time is updated on heartbeat and on leave. A crashed session is therefore always recorded.
- **Home row.** Up to 5 worlds, most recent first, one entry per world. It excludes system worlds (hub, tutorial, transit) and visits shorter than about 60 s. The row is hidden when empty.
- **"See all."** This opens the full history with no dwell filter, kept for about 90 days or 100 worlds. The design picks these values.
- **Rejoin card.** It appears only when the last session ended without the user choosing Leave (crash or disconnect), less than about 15 minutes ago, and that instance is still running and joinable. The top card then reads "Rejoin [world]" and joins that instance. It never rejoins automatically. Otherwise a tap joins the world normally.
- **Per-entry action.** "Remove from history."
- **Availability.** Worlds that are deleted, private or banned for this user are filtered out when the row renders. The list renders first, and the availability and liveness checks update it asynchronously.
- **Storage.** History is stored per account on the server, and the client caches the last list.
- **Setting.** "Show recent worlds on home" (default: Decisions 5) and "Clear history". This earns a setting because a streamer and a non-streamer on the same PC, or two members of a family sharing a headset, want different values.

**Rulings kept:** 5 entries on home, most recent first, on the home screen.

**Done when**
- After a forced crash mid-session, relaunching shows "Rejoin" and lands the user in the same instance with the same people.
- After visiting 8 worlds, the earliest one is reachable from "See all".
- A visit under 60 s, the hub and the tutorial never appear on the home row. Repeat visits show once.
- A deleted or private world never appears as a tappable entry.
- With the setting off, the home screen shows no history. Clear history empties it on every device.
- The history appears on a second device signed in to the same account.
- Account deletion and data export include the history.

**Pre-mortem: option C shipped and failed badly**
1. Visits are written on leave instead of join, so crashed sessions vanish. This hits R2 and is covered by the Recording rule; the risk is that it gets dropped during implementation.
2. The dwell threshold hides a short visit the user loved. This hits R3, and it is the reason "See all" keeps unfiltered history.
3. A user force-quits to escape harassment, the force-quit looks like a crash, and "Rejoin" invites them back. This hits R4, possibly a safety issue. Mitigation: the card is never automatic and names the world. Open question: should blocking someone in that instance suppress the card? Named risk.
4. Streamers never find the setting and history shows on stream. This hits R1 and leads to Decisions 5.
5. Server-side history is personal data, and it is not wired to account deletion or export. This breaks a platform or legal rule. Named risk; covered in Done when.
6. The liveness and availability checks delay the home screen. This hits R6, and is mitigated by rendering first and updating asynchronously.
7. The row displaces events and discovery and lowers new-world visits. This hits R7 and leads to Decisions 6.

## 6. Scenario table

Options:
- **A:** the original proposal.
- **B:** do nothing (search, plus favorites if they exist, unverified).
- **C:** the reshaped design above.
- **D:** smaller slice. C without the server: device-local history, the home row only (no "See all"), the rejoin card, the dwell, dedupe and system-world filters, remove, the availability filter and the setting.

| Scenario | A original | B nothing | C reshaped | D smaller slice |
| --- | --- | --- | --- | --- |
| S0 Common: returns next day to yesterday's hangout | One tap, fine | Search (R6) | One tap, fine | One tap, fine |
| S1 Crash mid-hangout with friends | New instance, friends elsewhere (R2); missing entirely if written on leave | R2 | Rejoins same instance, fine | Rejoins same instance, fine |
| S2 Eight-world event crawl, loved the 2nd | Gone (R3) | R3 | In "See all", fine | Gone (R3) |
| S3 Hub and tutorial repeats, 10 s bounces | Slots wasted (R6) | R6 | Filtered, fine | Filtered, fine |
| S4 Fled a hostile world after 10 s | It shows first (R4) | Fine | Filtered by dwell; remove if longer | Same as C |
| S5 Streamer or shared headset | Shown (R1) | Fine | Hidden with the setting off, fine | Hidden, fine |
| S6 World deleted or made private | Dead tap (R5) | Fine | Filtered, fine | Filtered, fine |
| S7 Second device | Empty if device-local (R6) | R6 | Present, fine | Empty (R6) |
| S8 Daily world pushed out by 5 others | Gone (R6) | R6 | In "See all": 2 taps, mild R6 | Gone (R6) |
| S9 New user, no history | Empty row (R7) | Fine | Row hidden, fine | Row hidden, fine |

**Contention**
- **A.** Home-screen space, shared with featured, events and friends-online rows. Whatever sits below the new row yields. Storage is unspecified.
- **B.** None.
- **C.**
  - Home space as in A, though the row is hidden when empty.
  - One backend write per join plus heartbeat updates. These peak at events and compete with matchmaking and presence traffic, so the history writes should yield (be dropped or batched) rather than slow joins.
  - Per-account storage, with retention and deletion obligations.
  - Liveness queries hit the instance service on home render.
- **D.** Home space as in C, plus liveness queries. Local storage is trivial.

**Settings cost**
- **A and B.** None.
- **C and D.** One toggle plus Clear history. It is justified by the streamer versus non-streamer on the same PC and the family sharing one headset. The count, dwell threshold, rejoin window and history length are chosen by the design, not exposed.

**Failure contract**
- **A.** If storage fails, the row is empty (R6). Removed worlds give dead taps (R5).
- **B.** Not applicable.
- **C.**
  - If the history service is down, the client shows the cached list. With no cache, it hides the row and the rest of home still works (R6).
  - If the liveness check fails or times out, the card joins the world rather than the instance (partial R2; joining via the friends list still works).
  - If the leave or heartbeat event is lost, the join-time entry still exists with its last known dwell.
  - If the availability check fails, entries show unfiltered; a dead tap removes that entry (R5 once).
- **D.** The same as C. A wiped local cache loses all history (R6).

## 7. Measurement

| Control | Rung protected | Proxy for | Class | Source |
| --- | --- | --- | --- | --- |
| Count = 5 on home | R3, R6 | The set of worlds the user wants to return to | Proxy. Diverges in S2 (8-world evening) and S8 (daily world pushed out); exceeded but harmless for a user with 2 habitual worlds | Request; general knowledge |
| Order = most recent | R2, R6 | Return intent | Proxy. Diverges in S4 (fled world first) and S3 (hub first). Exact for S1 | Request |
| Visit = any join | R3, R4, R6 | Was meaningfully there | Proxy. Diverges for bounces, failed loads and system worlds | Implicit in request |
| Dwell ≥ ~60 s (C, D) | R4, R6 | Was meaningfully there | Direct for time spent, measured at the client from join to leave or heartbeat; still a proxy for "liked it", which is unmeasurable | General knowledge, unverified for this client |
| Dedupe by world ID | R6 | Distinct places | Direct, if world IDs are stable (unverified) | General knowledge |
| System-world exclusion | R6 | Places the user chose | Direct, if worlds carry a system or hub flag (unverified) | General knowledge |
| Placement = home screen | R2, R6 | Reachable at the moment of intent | Proxy. Diverges in S1 if relaunch after a crash opens an error or login flow instead of home (unverified) | Request |
| Storage scope (account in C, device in D) | R6 | History follows the person | Direct in C (server per account); proxy in D, diverging in S7 | Request is silent |
| Rejoin window ~15 min and "left without Leave" | R2, R4 | Lost the session involuntarily, and the people are still there | Involuntary exit: direct, since the client knows whether Leave was chosen, but a force-quit looks like a crash (pre-mortem 3). People still there: direct if the instance service reports liveness and occupancy (unverified) | General knowledge |
| History length ~90 days / 100 (C) | R3 | All places the user might want back | Proxy. Diverges for a user returning after 4 months; harmless in practice | Design choice |
| Availability filter | R5 | Tap will succeed | Direct, via a server query at render (unverified that one exists) | General knowledge |
| Show-on-home toggle | R1 | Nobody unwanted is watching | Unmeasurable in general, because the app cannot know who is looking. Partially detectable where the platform reports screen capture (for example iOS `UIScreen.isCaptured`; unverified for this app's platforms) | Platform API, from memory, not looked up |
| Row-usage telemetry (taps per home open, rejoin success) | All | Whether the row gets people back | Direct for usage; the way to check this design after launch | General knowledge |

## 8. Decisions for the user

1. **Ladder order (assumed).**
   - Is exposed history (R1) worse than a lost session (R2)? If R2 ranks higher, the setting's default and capture detection matter less, and the rejoin card becomes the first thing to build.
   - Is R2 above R3? If R3 ranks higher, "See all" (and so the server) matters more than the rejoin card, which favors C over D.
2. **C or D.**
   - C needs backend work: storage, a join-time write, retention, deletion and export. It covers S2 and S7.
   - D is client-only, covers the top rungs (R1, R2, R4, R5) and leaves R3 and multi-device unsolved.
   - You could ship D first and add C's server later; D's local cache stays as C's fallback.
3. **The "last five" ruling.** Its premise, that the five most recent worlds cover return intent, fails in S2 and S8. The options:
   - keep 5 on home and add "See all" (the proposal)
   - raise the count, which costs home space (R7)
   - rank by frequency and recency together ("frecency"), which keeps daily worlds but makes the order less predictable ("where did it go?")
   - rely on pinned favorites for habitual worlds.

   Only you can choose between predictability and coverage.
4. **"Most recent first" ruling.** It is kept, because it is exactly right for S1. If you choose frecency in Decision 3, the rejoin card should still pin the last world first.
5. **Default of the show-on-home setting.**
   - On by default helps the common case (S0) but exposes streamers who never find the setting (R1).
   - Off by default protects R1 but most users never see the feature.
   - A third option: on by default, auto-hidden while the platform reports screen capture, where that is available.
6. **Placement priority.** The row's position relative to events, featured and friends-online rows trades return visits against discovery of new worlds (R7, and possibly creator traffic). This is a product call.
7. **Friends present.** Showing "friends here now" on entries would help R2, but it touches presence privacy (invisible status). It is left out of C. Decide whether you want it, as a separate change.
8. **Unverified facts.** Check these before committing:
   - whether joining a world from a list lands in the same instance, or whether instance IDs persist and can be rejoined
   - whether the instance service reports liveness and occupancy
   - whether worlds carry a system or hub flag and have stable IDs
   - whether a favorites feature already exists
   - what relaunch after a crash shows (home or another flow)
   - whether a server API exists to check a world's availability
   - the retention and deletion policy for per-account activity data
   - whether the target platforms report screen capture.
