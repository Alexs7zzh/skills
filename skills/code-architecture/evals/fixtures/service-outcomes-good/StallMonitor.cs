using System;
using System.Collections.Generic;

namespace CloudSave;

/// <summary>Server-reported transfer sample for the active upload.</summary>
public sealed record ThroughputSample(double? BytesPerSecond, int? ServerBacklog, double ObservedAtMs)
{
    public bool IsComplete => BytesPerSecond.HasValue && ServerBacklog.HasValue;
}

/// <summary>One bounded period of degraded main-thread scheduling while an upload is active.</summary>
public sealed class StallEpisode
{
    public double OpenedAtMs { get; }
    public double? ClosedAtMs { get; private set; }
    public int GapCount { get; private set; }
    public double LongestGapMs { get; private set; }
    public ThroughputSample Sample { get; private set; }

    public StallEpisode(double openedAtMs) => OpenedAtMs = openedAtMs;

    /// <summary>Keeps the first complete sample seen while open; partial samples never replace it.</summary>
    public void Observe(ThroughputSample sample)
    {
        if (Sample == null && sample != null && sample.IsComplete)
            Sample = sample;
    }

    public void RecordGap(double gapMs) => (GapCount, LongestGapMs) = (GapCount + 1, Math.Max(LongestGapMs, gapMs));

    public void Close(double nowMs) => ClosedAtMs = nowMs;
}

/// <summary>Detects stall episodes from frame scheduling gaps and reports each once when it ends.</summary>
public sealed class StallMonitor
{
    private const double GapThresholdMs = 250;
    private const double MaxEpisodeMs = 30_000;
    private const int QuietTicksToClose = 60;
    private const int HistoryLimit = 8;

    private readonly ITelemetrySink _sink;
    private readonly Queue<StallEpisode> _history = new();
    private ThroughputSample _latest;
    private StallEpisode _open;
    private double? _lastTickMs;
    private int _quietTicks;

    public StallMonitor(ITelemetrySink sink) => _sink = sink;

    public IEnumerable<StallEpisode> History => _history;

    public void OnThroughputSample(ThroughputSample sample)
    {
        _latest = sample;
        _open?.Observe(sample);
    }

    public void Tick(double nowMs)
    {
        var gapMs = _lastTickMs.HasValue ? nowMs - _lastTickMs.Value : 0;
        _lastTickMs = nowMs;
        if (gapMs > GapThresholdMs)
        {
            _quietTicks = 0;
            if (_open == null)
            {
                _open = new StallEpisode(nowMs);
                _open.Observe(_latest);
            }
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
        _sink.Send(StallSegmentSummary.EventName, StallSegmentSummary.From(_open));
        _open = null;
        _quietTicks = 0;
    }
}
