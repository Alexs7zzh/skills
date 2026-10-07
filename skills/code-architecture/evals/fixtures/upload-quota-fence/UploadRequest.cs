namespace Acme.Sync.Upload;

/// <summary>Who owns the payload and where it lives locally. Never leaves the process.</summary>
public sealed record UploadIdentity(string AccountId, string LocalPath);

public sealed record UploadRequest(string RequestId, UploadIdentity Identity, long SizeBytes);

public enum UploadPhase
{
    Idle,
    Reserving,
    Writing,
    RetryScheduled,
    Completed,
}

/// <summary>Read model for the sync status panel.</summary>
public sealed record UploadStatus(string? RequestId, UploadPhase Phase, ProviderObservation? LatestObservation);
