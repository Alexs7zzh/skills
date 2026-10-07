namespace Media.Upload;

public sealed record UploadProgress(string LeaseId, long BytesSent, long TotalBytes);
public sealed record UploadThroughput(string LeaseId, double BytesPerSecond);
public sealed record UploadAbandoned(string LeaseId, long BytesSent);

/// <summary>Publishes upload events for the UI.</summary>
public sealed class ProgressReporter(ReservationPool pool)
{
    public event Action<UploadProgress>? Progress;
    public event Action<UploadThroughput>? Throughput;
    public event Action<UploadAbandoned>? Abandoned;

    public void EmitProgress(PendingUpload item, long bytesSent, long totalBytes)
    {
        Progress?.Invoke(new UploadProgress(item.LeaseId, bytesSent, totalBytes));
        if (bytesSent >= totalBytes)
            pool.Release(item.ReservedBytes);
    }

    public void EmitThroughput(string leaseId, long bytes, TimeSpan elapsed)
    {
        if (elapsed > TimeSpan.Zero)
            Throughput?.Invoke(new UploadThroughput(leaseId, bytes / elapsed.TotalSeconds));
    }

    public void EmitAbandoned(string leaseId, long bytesSent) =>
        Abandoned?.Invoke(new UploadAbandoned(leaseId, bytesSent));
}
