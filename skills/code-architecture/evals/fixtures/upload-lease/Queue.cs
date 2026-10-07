using System.Diagnostics;
using System.Threading.Channels;

namespace Media.Upload;

/// <summary>Work item handed from the scheduler to the upload worker.</summary>
public sealed record PendingUpload(string LeaseId, Uri Endpoint, TimeSpan Lifetime, long ReservedBytes, string FilePath);

public sealed class UploadScheduler(ILeaseProvider leases, ChannelWriter<PendingUpload> queue, TimeProvider clock)
{
    public async Task ScheduleAsync(string filePath, CancellationToken ct)
    {
        var lease = await leases.AcquireAsync(new FileInfo(filePath).Length, ct);
        var pending = new PendingUpload(
            lease.LeaseId, lease.Endpoint, Lifetime: lease.ExpiresAt - clock.GetUtcNow(), lease.ReservedBytes, filePath);
        await queue.WriteAsync(pending, ct);
    }
}

public sealed class UploadWorker(
    ChannelReader<PendingUpload> queue,
    IUploadProvider provider,
    ProgressReporter progress,
    ReservationPool pool,
    TimeProvider clock)
{
    private const int ChunkSize = 4 * 1024 * 1024;

    public async Task RunAsync(CancellationToken ct)
    {
        while (await queue.WaitToReadAsync(ct))
        {
            while (queue.TryRead(out var item))
                await UploadAsync(item, ct);
            provider.AdviseIdle();
        }
    }

    private async Task UploadAsync(PendingUpload item, CancellationToken ct)
    {
        var deadline = clock.GetUtcNow() + item.Lifetime;
        await using var file = File.OpenRead(item.FilePath);
        var buffer = new byte[ChunkSize];
        long sent = 0;

        try
        {
            do
            {
                if (clock.GetUtcNow() >= deadline)
                {
                    Abandon(item, sent);
                    return;
                }

                var stopwatch = Stopwatch.StartNew();
                var read = await file.ReadAsync(buffer, ct);
                await provider.UploadChunkAsync(item.LeaseId, item.Endpoint, buffer.AsMemory(0, read), sent, ct);
                sent += read;
                if (sent == file.Length)
                    await provider.CompleteAsync(item.LeaseId, item.Endpoint, ct);

                progress.EmitThroughput(item.LeaseId, read, stopwatch.Elapsed);
                progress.EmitProgress(item, sent, file.Length);
            }
            while (sent < file.Length);
        }
        catch (Exception e) when (e is HttpRequestException || (e is OperationCanceledException && !ct.IsCancellationRequested))
        {
            Abandon(item, sent);
        }
    }

    private void Abandon(PendingUpload item, long sent)
    {
        pool.Release(item.ReservedBytes);
        progress.EmitAbandoned(item.LeaseId, sent);
    }
}
