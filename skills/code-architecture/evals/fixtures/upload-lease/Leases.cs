using System.Net.Http.Json;

namespace Media.Upload;

/// <summary>Lease issued by the storage provider for one upload.</summary>
public sealed record UploadLease(string LeaseId, Uri Endpoint, DateTimeOffset IssuedAt, DateTimeOffset ExpiresAt, long ReservedBytes);

public interface ILeaseProvider
{
    Task<UploadLease> AcquireAsync(long payloadBytes, CancellationToken ct);
}

public sealed class HttpLeaseProvider(HttpClient http, ReservationPool pool) : ILeaseProvider
{
    public async Task<UploadLease> AcquireAsync(long payloadBytes, CancellationToken ct)
    {
        using var response = await http.PostAsJsonAsync("/v3/leases", new { bytes = payloadBytes }, ct);
        response.EnsureSuccessStatusCode();
        var lease = await response.Content.ReadFromJsonAsync<UploadLease>(ct)
                    ?? throw new InvalidOperationException("Lease response had no body.");
        pool.Reserve(lease.ReservedBytes);
        return lease;
    }
}

/// <summary>Client-side budget of bytes reserved for in-flight uploads.</summary>
public sealed class ReservationPool(long capacityBytes)
{
    private readonly object _lock = new();
    private long _reservedBytes;

    public void Reserve(long bytes)
    {
        lock (_lock)
        {
            if (_reservedBytes + bytes > capacityBytes)
                throw new InvalidOperationException($"Upload budget exhausted; {bytes} bytes requested.");
            _reservedBytes += bytes;
        }
    }

    public void Release(long bytes)
    {
        lock (_lock) _reservedBytes = Math.Max(0, _reservedBytes - bytes);
    }
}
