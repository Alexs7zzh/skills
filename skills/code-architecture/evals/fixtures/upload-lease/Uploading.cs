using System.Diagnostics;

namespace Media.Upload;

public interface IUploadProvider
{
    Task UploadChunkAsync(string leaseId, Uri endpoint, ReadOnlyMemory<byte> chunk, long offset, CancellationToken ct);
    Task CompleteAsync(string leaseId, Uri endpoint, CancellationToken ct);

    /// <summary>Attributes subsequent requests to the given session.</summary>
    void SetSessionTag(string sessionTag) { }

    /// <summary>Tells the provider the client has no queued work.</summary>
    void AdviseIdle() { }
}

public sealed class HttpUploadProvider(HttpClient http) : IUploadProvider
{
    private string? _sessionTag;

    public void SetSessionTag(string sessionTag) => _sessionTag = sessionTag;

    public async Task UploadChunkAsync(string leaseId, Uri endpoint, ReadOnlyMemory<byte> chunk, long offset, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Put, new Uri(endpoint, $"chunks/{offset}"));
        request.Content = new ReadOnlyMemoryContent(chunk);
        await SendAsync(request, leaseId, ct);
    }

    public async Task CompleteAsync(string leaseId, Uri endpoint, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, new Uri(endpoint, "complete"));
        await SendAsync(request, leaseId, ct);
    }

    private async Task SendAsync(HttpRequestMessage request, string leaseId, CancellationToken ct)
    {
        request.Headers.Add("X-Upload-Lease", leaseId);
        if (_sessionTag is not null)
            request.Headers.Add("X-Upload-Session", _sessionTag);

        using var response = await http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
    }
}

/// <summary>
/// Wraps an upload provider with activity spans. Forwards every operation to
/// the inner provider and adds no behaviour of its own.
/// </summary>
public sealed class TracingUploadProvider(IUploadProvider inner) : IUploadProvider
{
    private static readonly ActivitySource Source = new("Media.Upload");

    public async Task UploadChunkAsync(string leaseId, Uri endpoint, ReadOnlyMemory<byte> chunk, long offset, CancellationToken ct)
    {
        using var activity = Source.StartActivity("upload.chunk");
        activity?.SetTag("upload.lease", leaseId);
        activity?.SetTag("upload.offset", offset);
        await inner.UploadChunkAsync(leaseId, endpoint, chunk, offset, ct);
    }

    public async Task CompleteAsync(string leaseId, Uri endpoint, CancellationToken ct)
    {
        using var activity = Source.StartActivity("upload.complete");
        activity?.SetTag("upload.lease", leaseId);
        await inner.CompleteAsync(leaseId, endpoint, ct);
    }
}
