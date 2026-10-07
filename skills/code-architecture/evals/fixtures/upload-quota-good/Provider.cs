using System;

namespace Acme.Sync.Upload;

/// <summary>Level attached by the storage provider to an observation.</summary>
public enum NativeLevel
{
    Info,
    Warning,
    Error,
    Fatal,
}

internal static class ProviderCodes
{
    public const string Ok = "ok";
    public const string Heartbeat = "heartbeat";
    public const string QuotaExceeded = "quota_exceeded";
}

/// <summary>What the provider reported for one call. <see cref="SafeText"/> is provider-authored.</summary>
public sealed record ProviderObservation(
    string Code,
    NativeLevel NativeLevel,
    string SafeText,
    DateTimeOffset ObservedAt)
{
    public bool Succeeded => Code == ProviderCodes.Ok;
}

internal static class ProviderSignatures
{
    public static bool IsQuotaRejection(ProviderObservation o) => o.Code == ProviderCodes.QuotaExceeded;

    public static bool IsHeartbeat(ProviderObservation o) => o.Code == ProviderCodes.Heartbeat;
}

public interface IUploadProvider
{
    /// <summary>Reserves capacity for the payload. Quota is enforced here.</summary>
    ProviderObservation Reserve(UploadRequest request);

    /// <summary>Streams the payload into the reserved slot and returns the terminal result.</summary>
    ProviderObservation Write(UploadRequest request);

    /// <summary>Liveness probe. Returns a heartbeat observation.</summary>
    ProviderObservation Probe();
}

public interface IRetryScheduler
{
    IScheduledRetry Schedule(TimeSpan delay, Action callback);
}

public interface IScheduledRetry
{
    void Cancel();
}
