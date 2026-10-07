using System;
using System.Collections.Generic;

namespace Acme.Sync.Upload;

/// <summary>
/// Drives one upload at a time against the storage provider and reports outcomes to the
/// diagnostic sinks. All members run on the sync worker thread; the host calls
/// <see cref="Tick"/> from that thread on its telemetry interval.
/// </summary>
public sealed class UploadService
{
    private static readonly TimeSpan RetryDelay = TimeSpan.FromSeconds(30);

    private readonly IUploadProvider _provider;
    private readonly IRetryScheduler _scheduler;
    private readonly IDiagnosticSink _sink;
    private readonly Queue<QueuedDiagnostic> _pending = new();

    private UploadRequest? _current;
    private UploadPhase _phase = UploadPhase.Idle;
    private ProviderObservation? _latestObservation;
    private IScheduledRetry? _pendingRetry;
    private bool _episodeSuppressed;

    public UploadService(IUploadProvider provider, IRetryScheduler scheduler, IDiagnosticSink sink)
    {
        _provider = provider;
        _scheduler = scheduler;
        _sink = sink;
    }

    public UploadStatus Status => new(_current?.RequestId, _phase, _latestObservation);

    /// <summary>Starts an upload. A request awaiting retry is replaced and not retried.</summary>
    public void Submit(UploadRequest request)
    {
        if (request.SizeBytes <= 0)
        {
            // The sync planner never hands us an empty payload.
            _sink.Write(new DiagnosticRow(DiagnosticSeverity.Error, request.RequestId, _phase,
                "Rejected request with empty payload", DateTimeOffset.UtcNow));
            return;
        }

        _pendingRetry?.Cancel();
        _pendingRetry = null;
        _current = request;
        Attempt(request);
    }

    /// <summary>Telemetry tick: records provider liveness and flushes batched failure rows.</summary>
    public void Tick()
    {
        var heartbeat = _provider.Probe();
        _sink.Write(new DiagnosticRow(Classify(heartbeat), _current?.RequestId, _phase,
            heartbeat.SafeText, heartbeat.ObservedAt));

        while (_pending.Count > 0)
        {
            var queued = _pending.Dequeue();
            _sink.Write(new DiagnosticRow(queued.Severity, queued.RequestId, queued.Phase,
                queued.Observation.SafeText, queued.Observation.ObservedAt));
        }
    }

    private void Attempt(UploadRequest request)
    {
        _phase = UploadPhase.Reserving;
        var reservation = _provider.Reserve(request);
        _latestObservation = reservation;
        if (!reservation.Succeeded)
        {
            Fail(request, reservation);
            return;
        }

        _phase = UploadPhase.Writing;
        var write = _provider.Write(request);
        _latestObservation = write;
        if (!write.Succeeded)
        {
            Fail(request, write);
            return;
        }

        _phase = UploadPhase.Completed;
        _episodeSuppressed = false;
    }

    private void Fail(UploadRequest request, ProviderObservation observation)
    {
        if (!_episodeSuppressed)
        {
            _episodeSuppressed = true;
            _pending.Enqueue(new QueuedDiagnostic(Classify(observation), request.RequestId, _phase, observation));
        }

        _phase = UploadPhase.RetryScheduled;
        _pendingRetry = _scheduler.Schedule(RetryDelay, () => Attempt(request));
    }

    private static DiagnosticSeverity Classify(ProviderObservation observation)
    {
        if (ProviderSignatures.IsHeartbeat(observation))
            return DiagnosticSeverity.Log;

        if (ProviderSignatures.IsQuotaRejection(observation))
            return DiagnosticSeverity.Warning;

        return observation.NativeLevel switch
        {
            NativeLevel.Fatal => DiagnosticSeverity.Error,
            NativeLevel.Error => DiagnosticSeverity.Error,
            NativeLevel.Warning => DiagnosticSeverity.Warning,
            _ => DiagnosticSeverity.Log,
        };
    }
}
