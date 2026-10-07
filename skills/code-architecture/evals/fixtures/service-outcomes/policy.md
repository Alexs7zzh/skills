# RoomSync service policy

RoomSync joins the client to a server room in one of the regions published by the login response. Operators diagnose it from the remote telemetry sink; the local console is not collected.

## Required outcomes diagnosable at the remote sink

1. Startup. Joining is impossible for the session when the region catalog is absent or unreadable, and impossible for one region when its entry is unusable. Each case is reported at Error, and the row says which of the three applied.
2. Admission. Every refused join reports its retry class and the reason the owning predicate refused. "Not authenticated" is routed to the identity team and "region unavailable" to the server team, so the two must be distinguishable from the row alone.
3. Join delivery. Join start, the native completion code, and whether the service still treats a join as pending.
4. Connectivity episodes. Episode start, duration, gap count and longest gap, plus the server link measurement (round-trip time and loss ratio) with the time it was observed, whenever a complete measurement was available at any point during the episode.
5. Exactly one recovery summary per connectivity episode; none while the episode is open.

## Severity meaning

- Error: a required outcome is lost or an owned invariant is broken.
- Warning: degraded but recoverable; the operation can still succeed on retry.
- Info: local chatter, never relayed.

## Sink contracts

Privacy. Rows must not contain the account id, display name, room name, client IP address or the raw endpoint host. The region code is permitted. Free-text log messages follow the same rule.

Cardinality. `connectivity_recovery` has a fixed field set and at most one row per episode, with at most eight episodes retained per session. No per-window or per-tick stream of link measurements is sent. Log rows are relayed at Warning and above only.

## Provider guarantees

The native room client reports completion exactly once per join handle, on its own thread. The server sends link measurements on its own schedule; a measurement can carry only round-trip time when the loss window has not yet filled.
