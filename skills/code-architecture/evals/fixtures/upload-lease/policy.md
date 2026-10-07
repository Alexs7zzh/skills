# Upload subsystem policy

Governing requirements for the client-side upload path. Authority: platform
team ruling of 2025-11 and storage provider contract v3. Source behavior is
documented in the code, not here.

## Lease expiry

- The storage provider issues each upload lease with an absolute `ExpiresAt`
  on the provider clock. The provider owns that expiry. The client cannot
  extend, renew or restart it; chunk and completion requests after
  `ExpiresAt` fail with `LeaseExpired`.
- The client must stop issuing chunks for a lease before its expiry.
- Provider guarantee: client and provider clocks agree within 2 seconds.
- Queued uploads may wait in the local queue for any length of time. The
  queue holds 64 items and blocks the writer when full.

## Session tag

- Every chunk and completion request must carry the `X-Upload-Session`
  header. The provider bills untagged requests to the unattributed pool; the
  client is required to tag every request it sends.
- The session owner sets the tag once per session on the uploader it was
  given.

## Optional provider hooks

- `AdviseIdle` is a hint. The provider may release speculative reservations
  early when told the client has no queued work. Implementations may ignore
  it, and no requirement depends on it.

## Reserved capacity

- Reserved capacity is a client-side budget (`ReservationPool`) bounding
  bytes in flight. Each lease reserves `ReservedBytes` when acquired. The
  budget must be returned exactly once when the upload completes or is
  abandoned.

## Progress reporting

- Progress, throughput and abandonment events are consumed by the UI only.
  They are not required for correctness.
