using System.Threading.Channels;

namespace Media.Upload;

public sealed record UploadModule(UploadScheduler Scheduler, UploadWorker Worker, ProgressReporter Progress)
{
    private const long BudgetBytes = 256L * 1024 * 1024;
    private const int QueueCapacity = 64;

    public static UploadModule Create(HttpClient http, string sessionTag, TimeProvider clock)
    {
        var pool = new ReservationPool(BudgetBytes);
        var queue = Channel.CreateBounded<PendingUpload>(
            new BoundedChannelOptions(QueueCapacity) { FullMode = BoundedChannelFullMode.Wait });

        IUploadProvider provider = new TracingUploadProvider(new HttpUploadProvider(http));
        provider.SetSessionTag(sessionTag);

        var progress = new ProgressReporter(pool);
        return new UploadModule(
            new UploadScheduler(new HttpLeaseProvider(http, pool), queue.Writer, clock),
            new UploadWorker(queue.Reader, provider, progress, pool, clock),
            progress);
    }
}
