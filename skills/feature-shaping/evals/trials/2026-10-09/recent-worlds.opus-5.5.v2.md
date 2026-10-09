# Feature shaping: "Recently visited worlds" on the home screen

Worked from the request and general knowledge only. No codebase, analytics or issue history was checked, so every fact about the product below is unverified.

## 1. Outcome

When someone wants to go back to a world they were in, they tap it from the home screen and they're there. They don't have to search for a name they half remember, and they don't permanently lose a world they reached through a friend's link or a portal.

## 2. Verdict on the proposal

**Partly delivers.** It handles the common case: going back to last night's world on the same device. It misses in these scenario rows:
- **Hop night.** After visiting 8 worlds through portals or an event, the one the user wants is in position 6, so it has dropped off the list.
- **Bounces and the hub.** Ten-second visits and the default spawn or hub world use up the five slots.
- **Unlisted world via link.** Search can't find it, so once it leaves the five slots it is gone for good. This is the worst outcome.
- **Device switch.** A device-local list is empty on the other platform.
- **World deleted or made private.** The tile leads to a load wait and then an error.
- **Streaming or shared screen.** The list shows where the user has been, and they have no way to remove an entry.

The proposal also has no evidence behind it yet. "Users can't get back to worlds" is *claimed*, not measured.

## 3. Proposal (reshaped)

**Change.** Keep an account-wide history of the worlds a user has joined. Show the most recent qualifying worlds as a row on the home screen, with a "See all" link to the full history.

**Rules**
- One entry per world (keyed by world ID), most recent first. The original's recency order stays.
- **Home row:** the last 5 *(placeholder)* worlds where the user stayed at least 2 minutes *(placeholder)*. The default hub or spawn world is excluded. The row is hidden until the first qualifying visit.
- **"See all":** every join from the last 90 days or 50 worlds *(placeholder)*, short visits included. This list is the safety net for a world the user glimpsed and lost.
- The history is stored on the account, not the device, so it carries across PC, headset and mobile.
- Access is checked when the row is shown. Worlds that were deleted or are now inaccessible are marked unavailable and never start a load. The check runs asynchronously and never blocks the home screen.
- Any entry can be removed ("Remove from recents").

**Done when**
- A world visited on one device for at least the dwell threshold appears at the top of the row on another device.
- A 10-second visit and a hub visit do not displace an entry from the home row, but both appear under "See all".
- A deleted or private world shows as unavailable, and tapping it never starts a load.
- A removed entry stays gone on every device.
- If the history service is down, the home screen still loads with the row hidden.

**How to set the placeholders.**
- **Row length:** from current logs, find where re-joined worlds sat in each user's history. Size the row to cover most returns.
- **Dwell threshold:** look at the distribution of session lengths and find the point where the chance of returning rises.
- **History depth:** measure how long after a visit returns still happen.

**Pre-mortem: it shipped and failed**

| Cause | Rung hit |
| --- | --- |
| Users actually get back to worlds by joining friends, not places, so the row is rarely tapped | 5 (home screen space) |
| The dwell filter hides a world the user wanted (they peeked, then left to fetch friends) and they never open "See all" | 1 (lost world) |
| A streamer's private world shows on the home screen on stream | 2 (exposure) |
| The access check is slow or blocks the home screen | 3/4 (waiting) |
| Server-side visit history triggers retention, export and delete obligations nobody planned for | hard limit (cost or compliance), unverified |

## 4. Decisions for the user

1. **Build it at all?** No evidence shows that users fail to get back today. One cheap check decides it: what share of world joins are re-joins, and how did the user get there (search, browse, friend, link)? If most re-joins come through friends, the shortcut belongs on people, not places. *Unverified: whether this analytics exists.*
2. **Exposure versus lost world** (*assumed* order). I ranked "lost a world for good" above "someone sees my history." For streamers or shared family devices the order may be the other way round.
   - Keep my order: per-entry removal is enough.
   - Flip it: add a "Hide recents" switch. Two users on one machine (a streamer and a non-streamer) would want different values, so the setting earns its place.
3. **Home screen space versus discovery** (*assumed* order). The row pushes featured or event content down. Who gives way: the row, discovery, or an A/B test that measures both row taps and discovery joins?
4. **Server-side storage of location history.** You decide retention length and whether it falls under data export and delete. *Unverified: the app's privacy obligations.*
5. **Adjacent: getting back to the people.** Returning to a world is not the same as returning to the friends or instance you were with ("rejoin my friends", "rejoin after a crash"). This design is out of scope unless you want it.

## 5. Idea chain

| Step | Problem it answered | Evidence for that problem | Control it introduced |
| --- | --- | --- | --- |
| Proposal: recents row on the home screen | Getting back to a world takes searching, or fails | *claimed*, no evidence given | count = 5; recency order; "visited" = any join; one entry per world; storage scope (unstated); home screen placement |

There are no rulings. Every constraint is a design choice from the request.

## 6. Experience ladder (worst first)

| # | Rung | Scenario | Why it sits above the next |
| --- | --- | --- | --- |
| 1 | Loses a world for good | Reached an unlisted world through a friend's link; three days later can't recall its name, and search doesn't list it | Permanent: no amount of effort gets it back |
| 2 | Their history is exposed (*assumed*) | A streamer opens the home screen live and a private world shows | A social cost that can't be undone, but the user keeps their worlds |
| 3 | Taps a dead entry | The world was deleted; they sit through a load, get an error, and still have to hunt | Waiting plus failure, and it erodes trust in the list |
| 4 | Hunts for the world | Finds it through search or a friend's profile after a minute | Costs time but succeeds |
| 5 | Pays home screen space (*assumed*) | A user who only plays featured events sees a row they never use above discovery | An attention cost only, nothing fails |

## 7. Scenario table

| Scenario | Original | Do nothing | Reshaped | Smaller slice: one "Last world" tile |
| --- | --- | --- | --- | --- |
| Common: back to last night's world, same device | found | 4 hunt | found | found |
| Hop night: wants the 6th most recent | 4 hunt / 1 lost | 4 hunt | found via "See all" | 4 hunt / 1 lost |
| Bounces and hub fill the slots | 4 hunt | 4 hunt | found (filtered) | 4 hunt (tile shows hub) |
| Unlisted world via link, fell out of top 5 | 1 lost | 1 lost | found via "See all" | 1 lost |
| Device switch, PC to headset | 4 hunt / 1 lost (if local) | 4 hunt | found | found (account-stored) |
| World deleted or made private | 3 dead tap | none | marked unavailable, no wait | 3 dead tap |
| Streaming or shared screen | 2 exposed | none | 2 reduced (removable) | 2 exposed (one world) |
| Never revisits anything | 5 empty row | none | none (row hidden) | 5 empty tile |

| Option | Contention | Settings cost | Failure contract |
| --- | --- | --- | --- |
| Original | Home screen space against discovery and friends | none | Local list survives offline; dead entries fail on load (rung 3) |
| Do nothing | none | none | n/a; users rely on search and friends (rung 4/1) |
| Reshaped | Home screen space; one access-check request per home load, batched with the feed | none (the hide switch is Decision 2) | History service down: row hidden, home works. Access check fails: entries shown, the tap falls back to the normal join error (rung 3) |
| Smaller slice | One tile of space | none | Service down: tile hidden |

## 8. Measurement

| Control | Rung it protects | Proxy for | Class | Source |
| --- | --- | --- | --- | --- |
| Count = 5 | 1, 4 | "The world I want is in view" (breaks on hop nights and heavy explorers) | proxy; the real quantity can be measured from where re-joins sat in history | Product join telemetry (unverified) |
| Recency order | 4 | Intent to return (breaks when a bounce outranks a 3-hour session) | proxy; kept, with dwell filtering instead of re-ranking | Session start and end events |
| "Visited" = any join | 1, 4 | A meaningful visit (breaks on portals, bounces, hub) | direct: session dwell is measured at runtime; the threshold is a placeholder | Client or server session timing |
| One entry per world ID | 4 | The place the user meant (breaks on event or friend instances, which is the adjacent rung) | direct for places | World ID on join |
| Storage scope | 1, 4 | Available wherever the user is (breaks on device switch) | direct when stored on the account | Account service (unverified) |
| Availability (missing from original) | 3 | Entry still joinable | direct: access check at display | World permissions API (unverified) |
| Home screen placement | 4, 5 | Fast return without hurting discovery | direct via A/B test (row taps against discovery joins) | Experiment framework (unverified) |
