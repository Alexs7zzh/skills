# CloudSave service policy

CloudSave uploads slot payloads to the profile server for the slots listed in the save manifest. Operators diagnose it from the remote telemetry sink; the local console is not collected.

## Required outcomes diagnosable at the remote sink

1. Startup. Cloud sync is disabled for the session when the manifest is absent, unreadable or has an unusable entry, or when the local slot store cannot be constructed. Each case is reported once at Error, and the row says which applied.
2. Admission. Every refused upload reports its retry class and the reason the owning predicate refused. "Locked by another device" is routed to the sync team and "slot not in manifest" to the profile team, so the two must be distinguishable from the row alone.
3. Upload delivery. Upload start, the native completion code, and whether the service still treats an upload as pending.
4. Stall episodes. Episode start, duration, gap count and longest gap, plus the server transfer sample (throughput and server backlog) with its own observation time, whenever a complete sample is available at opening or arrives while the episode is open.
5. Exactly one stall segment summary per episode; none while the episode is open.

## Severity meaning

- Error: a required outcome is lost or an owned invariant is broken.
- Warning: degraded but recoverable; the operation can still succeed on retry.
- Info: local chatter, never relayed.

## Sink contracts

Privacy. Rows must not contain the account id, display name, device name, local file paths or payload content. Server-assigned slot ids and byte counts are permitted. Free-text log messages follow the same rule.

Cardinality. `upload_stall_segment` has a fixed field set and at most one row per episode, with at most eight episodes retained per session. No per-window or per-tick stream of transfer samples is sent. Log rows are relayed at Warning and above only.

## Provider guarantees

The native save client reports completion exactly once per upload handle, on its own thread. The server sends transfer samples on its own schedule; a sample can carry only throughput before the backlog figure is known. Slot lock changes arrive through `OnSlotLockChanged` and are authoritative for the session.
