# Research account: ServiceLog relay (earlier trial)

Scope requested: the diagnostic relay only. Principle 33 selected. Producers upstream of `ServiceLog` and the `connectivity_recovery` row were not inspected.

## Coverage

| Producer | Carrier | Sink | Coverage |
| --- | --- | --- | --- |
| Any `ServiceLog.Info/Warning/Error` caller | `ServiceLog.Write` | Console; remote `log` row for Warning and above | Inspected |

## Diagnostic state

| Fact | Origin | Availability | Emission | Visibility |
| --- | --- | --- | --- | --- |
| Level | Caller's choice, owned | Immediate | `log` row field `level` | Warning and Error relayed; Info console only |
| Category | Caller's choice, owned | Immediate | `log` row field `category` | As above |
| Message | Caller's text, owned | Immediate | `log` row field `message` | As above |

## Policy to output

| Caller level | Console | Remote |
| --- | --- | --- |
| Info | yes | no |
| Warning | yes | yes, level `Warning` |
| Error | yes | yes, level `Error` |

The relay performs no remapping, suppression, aggregation or retention. The level, category and message a caller writes arrive at the remote sink unchanged. There is no generation fence or reset path in the relay. Every Warning and Error written by the service reaches the sink.

## Limits

Whether callers write a row for each required outcome, and at which level, was outside this account's scope.
