using System;
using System.Collections.Concurrent;
using System.Collections.Generic;

namespace RoomSync;

public enum RetryClass { None, RetryAfterAuth, RetryLater }

public sealed record AdmissionResult(bool Admitted, RetryClass RetryClass, string Detail)
{
    public static AdmissionResult Admit() => new(true, RetryClass.None, null);
    public static AdmissionResult Refuse(RetryClass retryClass, string detail) => new(false, retryClass, detail);
}

public sealed record JoinResult(int Handle, int NativeCode)
{
    public bool Succeeded => NativeCode == 0;
}

/// <summary>Native room client. Completed fires on the native thread.</summary>
public interface INativeRoomClient
{
    int BeginJoin(Uri address);
    event Action<int, int> Completed;
}

/// <summary>Owns region setup, join admission and join completion for the session.</summary>
public sealed class RoomSyncService
{
    private const string RefusedDetail = "Join refused by admission policy.";

    private readonly Dictionary<string, RegionEndpoint> _regions = new();
    private readonly ConcurrentQueue<JoinResult> _completed = new();
    private readonly INativeRoomClient _native;
    private readonly HealthMonitor _health;
    private int? _pendingJoin;
    private bool _authenticated;

    public event Action<JoinResult> JoinCompleted;

    public RoomSyncService(INativeRoomClient native, ITelemetrySink sink)
    {
        _native = native;
        _health = new HealthMonitor(sink);
    }

    public bool IsJoinPending => _pendingJoin.HasValue;

    public void Initialize(string catalogJson, bool authenticated)
    {
        _authenticated = authenticated;
        foreach (var entry in RegionCatalogLoader.Load(catalogJson))
        {
            try
            {
                var endpoint = new RegionEndpoint(entry);
                _regions[endpoint.Code] = endpoint;
            }
            catch (ArgumentException ex)
            {
                ServiceLog.Error("RoomSync", "Region catalog entry rejected: " + ex.Message);
            }
        }
        _native.Completed += OnNativeJoinCompleted;
    }

    public AdmissionResult Admit(string regionCode)
    {
        if (!_authenticated)
            return AdmissionResult.Refuse(RetryClass.RetryAfterAuth, RefusedDetail);
        if (!_regions.ContainsKey(regionCode))
            return AdmissionResult.Refuse(RetryClass.RetryLater, RefusedDetail);
        if (IsJoinPending)
            return AdmissionResult.Refuse(RetryClass.RetryLater, "A join is already in progress.");
        return AdmissionResult.Admit();
    }

    public bool RequestJoin(string regionCode)
    {
        var admission = Admit(regionCode);
        if (!admission.Admitted)
        {
            ServiceLog.Warning("RoomSync", $"{admission.Detail} retry={admission.RetryClass}");
            return false;
        }
        _pendingJoin = _native.BeginJoin(_regions[regionCode].Address);
        ServiceLog.Info("RoomSync", $"Join started region={regionCode} handle={_pendingJoin}");
        return true;
    }

    public void OnLinkMeasurement(LinkMeasurement measurement) => _health.OnLinkMeasurement(measurement);

    // Main thread, once per frame.
    public void Tick(double nowMs)
    {
        _health.Tick(nowMs);
        DrainCompletions();
    }

    // Native thread. Results are handed to the main thread through the queue.
    private void OnNativeJoinCompleted(int handle, int nativeCode) => _completed.Enqueue(new JoinResult(handle, nativeCode));

    private void DrainCompletions()
    {
        while (_completed.TryDequeue(out var result))
        {
            if (_pendingJoin == result.Handle)
                _pendingJoin = null;
            if (result.Succeeded)
                ServiceLog.Info("RoomSync", $"Join completed handle={result.Handle}");
            else
                ServiceLog.Error("RoomSync", $"Join failed handle={result.Handle} code={result.NativeCode}");
            JoinCompleted?.Invoke(result);
        }
    }
}
