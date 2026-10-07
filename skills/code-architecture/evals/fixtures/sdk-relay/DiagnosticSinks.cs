using System;

namespace Acme.Realtime.Diagnostics;

public enum DiagnosticSeverity
{
    Log = 0,
    Warning = 1,
    Error = 2,
}

/// <summary>A row written to the diagnostic sinks.</summary>
public sealed record RelayRow(
    DiagnosticSeverity Severity,
    string Category,
    string Message,
    DateTimeOffset ObservedAt);

public interface IDiagnosticSink
{
    void Write(RelayRow row);
}

/// <summary>Per-session log file on the client machine. Receives every row.</summary>
public sealed class LocalLogSink : IDiagnosticSink
{
    private readonly ILogWriter _writer;

    public LocalLogSink(ILogWriter writer) => _writer = writer;

    public void Write(RelayRow row) =>
        _writer.WriteLine($"{row.ObservedAt:O} {row.Severity} {row.Category} {row.Message}");
}

/// <summary>Batched upload to the telemetry service. Receives rows at or above the threshold.</summary>
public sealed class RemoteTelemetrySink : IDiagnosticSink
{
    public const DiagnosticSeverity MinimumSeverity = DiagnosticSeverity.Warning;

    private readonly ITelemetryClient _client;

    public RemoteTelemetrySink(ITelemetryClient client) => _client = client;

    public void Write(RelayRow row)
    {
        if (row.Severity < MinimumSeverity)
            return;

        _client.Enqueue(new TelemetryRecord(row.ObservedAt, row.Severity.ToString(), row.Category, row.Message));
    }
}

/// <summary>Fans one row out to the local and remote sinks.</summary>
public sealed class CompositeSink : IDiagnosticSink
{
    private readonly IDiagnosticSink[] _sinks;

    public CompositeSink(params IDiagnosticSink[] sinks) => _sinks = sinks;

    public void Write(RelayRow row)
    {
        foreach (var sink in _sinks)
            sink.Write(row);
    }
}

public interface ILogWriter { void WriteLine(string line); }

public sealed record TelemetryRecord(DateTimeOffset ObservedAt, string Severity, string Category, string Message);

public interface ITelemetryClient { void Enqueue(TelemetryRecord record); }
