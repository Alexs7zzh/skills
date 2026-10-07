using System;

namespace Acme.Realtime.Diagnostics;

/// <summary>
/// Holds the negotiation evidence the session summary needs. The transport reports a
/// protocol downgrade once, at negotiation time, long before the session ends.
/// </summary>
public sealed class SessionEvidence
{
    private string? _downgradeMessage;
    private DateTimeOffset? _downgradeObservedAt;

    public void Reset()
    {
        _downgradeMessage = null;
        _downgradeObservedAt = null;
    }

    public void Observe(TransportLogEvent evt)
    {
        if (!TransportSignatures.IsProtocolDowngrade(evt))
            return;

        _downgradeMessage = evt.Message;
        _downgradeObservedAt = evt.ObservedAt;
    }

    /// <summary>Returns the summary row for this session, or null when no downgrade was observed.</summary>
    public RelayRow? BuildSummary(DateTimeOffset sessionEndedAt)
    {
        if (_downgradeMessage is null || _downgradeObservedAt is null)
            return null;

        var age = sessionEndedAt - _downgradeObservedAt.Value;
        return new RelayRow(
            DiagnosticSeverity.Warning,
            "Session.Summary",
            $"{_downgradeMessage} (observed {age.TotalSeconds:F0}s before session end)",
            sessionEndedAt);
    }
}
