using System;
using System.Collections.Generic;

namespace CloudSave;

/// <summary>Remote telemetry destination. See policy.md for its privacy and cardinality contracts.</summary>
public interface ITelemetrySink
{
    void Send(string eventName, IReadOnlyDictionary<string, object> fields);
}

/// <summary>The single row sent for a stall episode when it closes.</summary>
public static class StallSegmentSummary
{
    public const string EventName = "upload_stall_segment";

    public static IReadOnlyDictionary<string, object> From(StallEpisode episode)
    {
        return new Dictionary<string, object>
        {
            ["opened_at_ms"] = episode.OpenedAtMs,
            ["duration_ms"] = episode.ClosedAtMs - episode.OpenedAtMs,
            ["gap_count"] = episode.GapCount,
            ["longest_gap_ms"] = episode.LongestGapMs,
            ["bytes_per_second"] = episode.Sample?.BytesPerSecond,
            ["server_backlog"] = episode.Sample?.ServerBacklog,
            ["sample_observed_at_ms"] = episode.Sample?.ObservedAtMs,
        };
    }
}

public enum LogLevel { Info, Warning, Error }

/// <summary>Local log for everything; Warning and above are also relayed to the remote sink.</summary>
public static class ServiceLog
{
    public static ITelemetrySink RemoteSink { get; set; }

    public static void Info(string category, string message) => Write(LogLevel.Info, category, message);
    public static void Warning(string category, string message) => Write(LogLevel.Warning, category, message);
    public static void Error(string category, string message) => Write(LogLevel.Error, category, message);

    private static void Write(LogLevel level, string category, string message)
    {
        Console.WriteLine($"[{level}] {category}: {message}");
        if (level < LogLevel.Warning)
            return;
        RemoteSink?.Send("log", new Dictionary<string, object> { ["level"] = level.ToString(), ["category"] = category, ["message"] = message });
    }
}
