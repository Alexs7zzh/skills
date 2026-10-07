# Directory module goals

Authority: client platform goals document of 2026-01 and directory service
contract v1. Source behavior is documented in the code, not here.

## Goals

- The room list shows only listings the directory service still considers
  valid. The service declares each listing's validity as `TtlSeconds`,
  counted from the moment the service produced the response. The service
  owns validity; the client may show a listing for a shorter time, not a
  longer one.
- A room closed by its host disappears from the room list and from the
  favorites list within 1 second of the `rooms.closed` push event, without
  waiting for the next refresh.
- Directory requests are bounded so a hung service never blocks the refresh
  loop indefinitely. No requirement sets the magnitude of the bound, and the
  service's response-time distribution on client networks has not been
  measured.
- Lookup hit and miss counts for the room list are reported to telemetry.
  Favorites store mutations are logged at Debug for support.
- Teardown spans frames: `BeginShutdown` runs on the frame the session ends;
  `CompleteShutdown` runs after the final dispatcher drain, at most two
  frames later. After `BeginShutdown` the directory must not act on push
  events.

## Accepted tradeoffs

- The main-thread dispatcher drains once per frame. While the app is
  backgrounded the OS suspends frames; queued work runs when the app
  resumes, which can be minutes later. Accepted for the directory.
- A refresh failure (timeout or transport error) skips that cycle. The next
  cycle is the recovery.
- A refresh page reflects service state at the time the service produced it.
  A room closed while a request is in flight can reappear when that page is
  applied and leaves again on the next refresh. Accepted.
- The rooms and favorites caches are separate stores so their decorators can
  differ. No requirement says they share one decorator.
- Push channel callbacks run on the channel's thread and may still be
  delivered until the subscription handle is disposed. Provider guarantee:
  disposing the handle blocks until no callback is executing.

## Non-goals

- Persisting listings across launches.
- Revalidating a single room against the service on lookup.
