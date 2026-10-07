using System;

namespace Acme.Realtime.Diagnostics;

/// <summary>
/// Forwards the transport SDK's log callback to the project's diagnostic sinks.
/// Runs on the SDK's callback thread; sinks are expected to be thread safe.
/// </summary>
public sealed class DiagnosticRelay : IDisposable
{
    private static readonly string[] ChatterCategories =
    {
        "Transport.Heartbeat",
        "Transport.Pacing",
        TransportSignatures.ConnectionCategory,
    };

    private readonly ITransportLogSource _source;
    private readonly IDiagnosticSink _sink;
    private readonly SessionEvidence _evidence;

    public DiagnosticRelay(ITransportLogSource source, IDiagnosticSink sink, SessionEvidence evidence)
    {
        _source = source;
        _sink = sink;
        _evidence = evidence;
        _source.Emitted += OnTransportEvent;
    }

    public void BeginSession() => _evidence.Reset();

    public void EndSession(DateTimeOffset endedAt)
    {
        var summary = _evidence.BuildSummary(endedAt);
        if (summary is not null)
            _sink.Write(summary);

        _evidence.Reset();
    }

    public void Dispose() => _source.Emitted -= OnTransportEvent;

    private void OnTransportEvent(TransportLogEvent evt)
    {
        _evidence.Observe(evt);
        _sink.Write(new RelayRow(Classify(evt), evt.Category, evt.Message, evt.ObservedAt));
    }

    private static DiagnosticSeverity Classify(TransportLogEvent evt)
    {
        // Routine heartbeat, pacing and connection-state traffic stays in the local log.
        if (IsChatter(evt) && !TransportSignatures.IsConnectionFailure(evt))
            return DiagnosticSeverity.Log;

        return evt.NativeLevel switch
        {
            NativeLogLevel.Fatal => DiagnosticSeverity.Error,
            NativeLogLevel.Error => DiagnosticSeverity.Error,
            NativeLogLevel.Warning => DiagnosticSeverity.Warning,
            _ => DiagnosticSeverity.Log,
        };
    }

    private static bool IsChatter(TransportLogEvent evt) =>
        Array.IndexOf(ChatterCategories, evt.Category) >= 0;
}
