using System;
using System.Collections.Generic;

namespace RoomSync;

/// <summary>Server-reported link measurement for the joined region.</summary>
public sealed record LinkMeasurement(double? RttMs, double? LossRatio, double ObservedAtMs)
{
    public bool IsComplete => RttMs.HasValue && LossRatio.HasValue;
}

/// <summary>One bounded period of degraded main-thread scheduling while connected.</summary>
public sealed class ConnectivityEpisode
{
    public double OpenedAtMs { get; }
    public double? ClosedAtMs { get; private set; }
    public int GapCount { get; private set; }
    public double LongestGapMs { get; private set; }
    public LinkMeasurement Measurement { get; }

    public ConnectivityEpisode(double openedAtMs, LinkMeasurement measurement) => (OpenedAtMs, Measurement) = (openedAtMs, measurement);

    public void RecordGap(double gapMs) => (GapCount, LongestGapMs) = (GapCount + 1, Math.Max(LongestGapMs, gapMs));

    public void Close(double nowMs) => ClosedAtMs = nowMs;
}

/// <summary>Detects connectivity episodes from frame scheduling gaps and reports each once on recovery.</summary>
public sealed class HealthMonitor
{
    private const double GapThresholdMs = 250;
    private const double MaxEpisodeMs = 30_000;
    private const int QuietTicksToClose = 60;
    private const int HistoryLimit = 8;

    private readonly ITelemetrySink _sink;
    private readonly Queue<ConnectivityEpisode> _history = new();
    private LinkMeasurement _latest;
    private ConnectivityEpisode _open;
    private double? _lastTickMs;
    private int _quietTicks;

    public HealthMonitor(ITelemetrySink sink) => _sink = sink;

    public IEnumerable<ConnectivityEpisode> History => _history;

    public void OnLinkMeasurement(LinkMeasurement measurement) => _latest = measurement;

    public void Tick(double nowMs)
    {
        var gapMs = _lastTickMs.HasValue ? nowMs - _lastTickMs.Value : 0;
        _lastTickMs = nowMs;
        if (gapMs > GapThresholdMs)
        {
            _quietTicks = 0;
            _open ??= new ConnectivityEpisode(nowMs, _latest);
            _open.RecordGap(gapMs);
        }
        else if (_open != null)
            _quietTicks++;

        if (_open != null && (_quietTicks >= QuietTicksToClose || nowMs - _open.OpenedAtMs >= MaxEpisodeMs))
            CloseEpisode(nowMs);
    }

    private void CloseEpisode(double nowMs)
    {
        _open.Close(nowMs);
        _history.Enqueue(_open);
        while (_history.Count > HistoryLimit)
            _history.Dequeue();
        _sink.Send(RecoverySummary.EventName, RecoverySummary.From(_open));
        _open = null;
        _quietTicks = 0;
    }
}
