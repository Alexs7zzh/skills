# Permission subsystem policy

Governing requirements for the client-side permission module. Authority:
security review ruling of 2026-02 and authorization service contract v2.
Source behavior is documented in the code, not here.

## Grant validity

- The authorization service evaluates a subject's scopes and returns the
  evaluation time (`EvaluatedAt`) and an absolute expiry (`ExpiresAt`), both
  on the service clock. The service owns validity. A privileged action is
  allowed only while the grant's `ExpiresAt` has not passed; the client must
  not extend validity or derive it from a client-side event.
- Provider guarantee: service and client clocks agree within 1 second.
  Grants for one subject arrive in evaluation order.
- Grants may wait in the relay for any length of time. The game thread drains
  the relay once per tick and may stall for several seconds under load.

## Durable records and commit notification

- Every grant is written to the local store. Every committed write must reach
  the replication outbox so peer nodes converge within one replication
  interval. Store contract: `Subscribe` registers a listener that is invoked
  after each durable commit. The replication sender that drains the outbox is
  outside this module.
- Scope sets are encrypted at rest. Encryption is a storage concern and must
  not change what callers of the store observe.
- The admin view reads stored records through the module; it does not read
  the cache.

## Lifecycle

- The module owner calls `ShutdownAsync` during teardown. Grants already in
  the relay at that point are delivered to the cache before the store is
  released.
- Before calling `ShutdownAsync`, the owner stops issuing `RefreshAsync` calls
  and awaits any that are outstanding.

## Not required

- Warming the cache from the store at startup is a future consideration, not
  a requirement.
