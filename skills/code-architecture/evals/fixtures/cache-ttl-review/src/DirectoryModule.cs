namespace Social.Directory;

public sealed class DirectoryModule
{
    private readonly CancellationTokenSource _refreshCts = new();
    private readonly DirectoryRefresher _refresher;
    private readonly DirectorySubscription _subscription;

    public MainThreadDispatcher Dispatcher { get; } = new();
    public RoomDirectoryCache Rooms { get; }
    public RoomDirectoryCache Favorites { get; }

    public DirectoryModule(HttpClient http, IPushChannel channel, IFavoriteRooms favoriteRooms, IDirectoryMetrics metrics, ILogger log, TimeProvider clock)
    {
        Rooms = new RoomDirectoryCache(new MeteredListingStore(new MemoryListingStore(), metrics), clock);
        Favorites = new RoomDirectoryCache(new LoggingListingStore(new MemoryListingStore(), log), clock);

        _refresher = new DirectoryRefresher(new HttpDirectoryClient(http), Dispatcher, Rooms, Favorites, favoriteRooms, log);
        _subscription = new DirectorySubscription(channel, Dispatcher, Rooms, Favorites);
    }

    public Task RunAsync() => _refresher.RunAsync(_refreshCts.Token);

    /// <summary>Called on the frame the session ends.</summary>
    public void BeginShutdown()
    {
        _refreshCts.Cancel();
        _subscription.Retire();
    }

    /// <summary>Called after the final dispatcher drain.</summary>
    public void CompleteShutdown()
    {
        _subscription.Dispose();
        _refreshCts.Dispose();
    }
}
