# Diagnostic relay policy

Scope: the relay between the vendor transport SDK's log callback and the project's diagnostic sinks. The SDK is external; the project owns the relay, the sinks and the session summary.

## Destinations

- Local session log: every row.
- Remote telemetry: Warning and Error rows. Operators watch remote telemetry only. Error rows page the on-call engineer; Warning rows are reviewed in the daily report.

## Classification

- Transport chatter (heartbeat, pacing, routine connection state changes) is Log and stays local.
- `Connection attempt failed` in category `Transport.Connection` is Warning. Every occurrence must reach remote telemetry at Warning so the daily review can tell a transport that failed to connect from an SDK that silently stopped attempting connections; absence of the row means no attempt was made. The SDK reports this message at Warning, Error or Fatal depending on which rung of its retry ladder failed. The project's classification does not depend on that level.
- Other transport failures (codec, serialization, authentication) keep the weight the SDK reports: Error and Fatal map to Error, Warning to Warning, lower levels to Log.
- A protocol downgrade is reported once per session, at session end, at Warning, with the time it was observed.

## Privacy

Transport messages carry no account identity. Rows forward them verbatim.
