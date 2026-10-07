# Upload diagnostics policy

Scope: the background upload service that moves finished recordings to the storage provider. The provider is external; the project owns the service, its retry loop and its diagnostic rows.

## Destinations

- Local diagnostic log: every row.
- Telemetry upload: Warning and Error rows. Operators watch telemetry only. Error rows page the on-call engineer; Warning rows feed the daily capacity review.

## Classification

- A quota rejection from the provider (code `quota_exceeded`) is Warning regardless of the level the provider attaches. The provider reports it at Warning, Error or Fatal depending on which enforcement tier rejected the write; the capacity review needs every occurrence under one severity and the on-call engineer must not be paged for it.
- Provider heartbeats (code `heartbeat`) are Log and stay local, including the degraded-latency heartbeat the provider reports at Warning.
- Other provider failures keep the level the provider reports: Error and Fatal map to Error, Warning to Warning.
- Violations of the service's own preconditions are Error.
- A failure row describes the request and phase that failed and the provider observation that failed it. Failure rows are suppressed from the first failure until the service recovers with a successful write, so a failure episode produces one row; a new episode after recovery produces its own row.

## Provider guarantees

- Every observation carries exactly one code. `heartbeat` and `quota_exceeded` never co-occur, and a heartbeat is never a terminal result of `Reserve` or `Write`.
- `SafeText` is provider-authored and carries no customer identity.
- The provider does not report why quota was exceeded; the cause is not available to the service.

## Privacy

Account identifiers and local file paths never leave the process. Rows carry the request id and the provider's safe text only.
