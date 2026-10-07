using System;
using System.Collections.Concurrent;
using System.Collections.Generic;

namespace CloudSave;

public enum RetryClass { None, RetryLater, Terminal }

public enum AdmissionReason { Admitted, SyncUnavailable, SlotUnknown, SlotLockedElsewhere, UploadPending }

public sealed record AdmissionResult(AdmissionReason Reason, RetryClass RetryClass, string Detail)
{
    public bool Admitted => Reason == AdmissionReason.Admitted;
    public static AdmissionResult Admit() => new(AdmissionReason.Admitted, RetryClass.None, null);
}

public sealed record UploadResult(int Handle, string SlotId, int NativeCode)
{
    public bool Succeeded => NativeCode == 0;
}

/// <summary>Native save client. Completed fires on the native thread.</summary>
public interface INativeSaveClient
{
    int BeginUpload(string slotId, byte[] payload);
    event Action<int, int> Completed;
}

/// <summary>Owns manifest setup, upload admission and upload completion for the session.</summary>
public sealed class CloudSaveService
{
    private readonly ConcurrentQueue<(int Handle, int NativeCode)> _completed = new();
    private readonly HashSet<string> _lockedElsewhere = new();
    private readonly INativeSaveClient _native;
    private readonly StallMonitor _stalls;
    private SlotStore _store;
    private (int Handle, string SlotId)? _pendingUpload;

    public event Action<UploadResult> UploadCompleted;

    public CloudSaveService(INativeSaveClient native, ITelemetrySink sink)
    {
        _native = native;
        _stalls = new StallMonitor(sink);
    }

    public bool IsUploadPending => _pendingUpload.HasValue;

    public void Initialize(string manifestJson, string cacheDirectory)
    {
        var manifest = SaveManifestLoader.Load(manifestJson);
        if (manifest.Status != ManifestStatus.Loaded)
            return; // The loader has already reported why; sync stays disabled.
        try
        {
            _store = new SlotStore(manifest.Slots, cacheDirectory);
        }
        catch (SlotStoreException ex)
        {
            ServiceLog.Error("CloudSave", $"Slot store unavailable ({ex.Fault}); cloud sync disabled for this session.");
            return;
        }
        _native.Completed += OnNativeUploadCompleted;
    }

    public void OnSlotLockChanged(string slotId, bool lockedElsewhere)
    {
        if (lockedElsewhere) _lockedElsewhere.Add(slotId);
        else _lockedElsewhere.Remove(slotId);
    }

    public AdmissionResult Admit(string slotId)
    {
        if (_store == null)
            return new(AdmissionReason.SyncUnavailable, RetryClass.Terminal, "Cloud sync is disabled for this session.");
        if (_store.Find(slotId) == null)
            return new(AdmissionReason.SlotUnknown, RetryClass.Terminal, $"Slot {slotId} is not in the manifest.");
        if (_lockedElsewhere.Contains(slotId))
            return new(AdmissionReason.SlotLockedElsewhere, RetryClass.RetryLater, $"Slot {slotId} is locked by another device.");
        if (IsUploadPending)
            return new(AdmissionReason.UploadPending, RetryClass.RetryLater, $"Upload {_pendingUpload.Value.Handle} has completed natively or is in flight and has not been drained.");
        return AdmissionResult.Admit();
    }

    public bool RequestUpload(string slotId, byte[] payload)
    {
        var admission = Admit(slotId);
        if (!admission.Admitted)
        {
            ServiceLog.Warning("CloudSave", $"Upload refused reason={admission.Reason} retry={admission.RetryClass}: {admission.Detail}");
            return false;
        }
        var handle = _native.BeginUpload(slotId, payload);
        _pendingUpload = (handle, slotId);
        ServiceLog.Info("CloudSave", $"Upload started slot={slotId} handle={handle} bytes={payload.Length}");
        return true;
    }

    public void OnThroughputSample(ThroughputSample sample) => _stalls.OnThroughputSample(sample);

    // Main thread, once per frame.
    public void Tick(double nowMs)
    {
        _stalls.Tick(nowMs);
        DrainCompletions();
    }

    // Native thread. Results are handed to the main thread through the queue.
    private void OnNativeUploadCompleted(int handle, int nativeCode) => _completed.Enqueue((handle, nativeCode));

    private void DrainCompletions()
    {
        while (_completed.TryDequeue(out var completion))
        {
            var slotId = _pendingUpload?.Handle == completion.Handle ? _pendingUpload.Value.SlotId : null;
            if (slotId != null)
                _pendingUpload = null;
            var result = new UploadResult(completion.Handle, slotId, completion.NativeCode);
            if (result.Succeeded)
                ServiceLog.Info("CloudSave", $"Upload completed slot={slotId} handle={result.Handle}");
            else
                ServiceLog.Error("CloudSave", $"Upload failed slot={slotId} handle={result.Handle} code={result.NativeCode}");
            UploadCompleted?.Invoke(result);
        }
    }
}
