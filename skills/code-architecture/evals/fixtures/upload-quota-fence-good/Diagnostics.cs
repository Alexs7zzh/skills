using System;

namespace Acme.Sync.Upload;

public enum DiagnosticSeverity
{
    Log = 0,
    Warning = 1,
    Error = 2,
}

/// <summary>A row written to the diagnostic sinks. Carries the request id and provider safe text only.</summary>
public sealed record DiagnosticRow(
    DiagnosticSeverity Severity,
    string? RequestId,
    UploadPhase Phase,
    string? Detail,
    DateTimeOffset ObservedAt);

/// <summary>A failure row waiting for the next telemetry tick.</summary>
public sealed record QueuedDiagnostic(
    DiagnosticSeverity Severity,
    string RequestId,
    UploadPhase Phase,
    ProviderObservation Observation);

public interface IDiagnosticSink
{
    void Write(DiagnosticRow row);
}

/// <summary>Writes every row to the local diagnostic log and Warning/Error rows to telemetry.</summary>
public sealed class DiagnosticRouter : IDiagnosticSink
{
    public const DiagnosticSeverity TelemetryThreshold = DiagnosticSeverity.Warning;

    private readonly ILogWriter _local;
    private readonly ITelemetryUploader _telemetry;

    public DiagnosticRouter(ILogWriter local, ITelemetryUploader telemetry)
    {
        _local = local;
        _telemetry = telemetry;
    }

    public void Write(DiagnosticRow row)
    {
        _local.WriteLine($"{row.ObservedAt:O} {row.Severity} {row.Phase} {row.RequestId ?? "-"} {row.Detail}");

        if (row.Severity >= TelemetryThreshold)
            _telemetry.Enqueue(row);
    }
}

public interface ILogWriter { void WriteLine(string line); }

public interface ITelemetryUploader { void Enqueue(DiagnosticRow row); }
