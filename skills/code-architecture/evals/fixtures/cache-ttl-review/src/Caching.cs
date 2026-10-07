using System.Collections.Concurrent;

namespace Social.Directory;

public sealed record CacheEntry(RoomListing Listing, DateTimeOffset ExpiresAt);

public interface IDirectoryMetrics
{
    void Hit();
    void Miss();
}

public interface IListingStore
{
    IEnumerable<CacheEntry> Entries { get; }
    bool TryGet(string roomId, out CacheEntry entry);
    void Replace(IReadOnlyList<CacheEntry> entries);

    /// <summary>Removes one room ahead of the next refresh.</summary>
    void Invalidate(string roomId) { }
}

public sealed class MemoryListingStore : IListingStore
{
    private Dictionary<string, CacheEntry> _entries = new();

    public IEnumerable<CacheEntry> Entries => _entries.Values;
    public bool TryGet(string roomId, out CacheEntry entry) => _entries.TryGetValue(roomId, out entry!);
    public void Replace(IReadOnlyList<CacheEntry> entries) => _entries = entries.ToDictionary(e => e.Listing.RoomId);
    public void Invalidate(string roomId) => _entries.Remove(roomId);
}

/// <summary>Counts lookups for telemetry. Forwards the store contract to the inner store.</summary>
public sealed class MeteredListingStore(IListingStore inner, IDirectoryMetrics metrics) : IListingStore
{
    public IEnumerable<CacheEntry> Entries => inner.Entries;

    public bool TryGet(string roomId, out CacheEntry entry)
    {
        var found = inner.TryGet(roomId, out entry);
        if (found) metrics.Hit(); else metrics.Miss();
        return found;
    }

    public void Replace(IReadOnlyList<CacheEntry> entries) => inner.Replace(entries);
}

/// <summary>Logs mutations for support. Forwards the store contract to the inner store.</summary>
public sealed class LoggingListingStore(IListingStore inner, ILogger log) : IListingStore
{
    public IEnumerable<CacheEntry> Entries => inner.Entries;
    public bool TryGet(string roomId, out CacheEntry entry) => inner.TryGet(roomId, out entry);

    public void Replace(IReadOnlyList<CacheEntry> entries)
    {
        log.LogDebug("Replacing {Count} listings", entries.Count);
        inner.Replace(entries);
    }

    public void Invalidate(string roomId)
    {
        log.LogDebug("Invalidating {RoomId}", roomId);
        inner.Invalidate(roomId);
    }
}

/// <summary>Main-thread view of directory listings with expiry.</summary>
public sealed class RoomDirectoryCache(IListingStore store, TimeProvider clock)
{
    public void Replace(IReadOnlyList<RoomListing> listings)
    {
        var now = clock.GetUtcNow();
        store.Replace(listings.Select(l => new CacheEntry(l, now + TimeSpan.FromSeconds(l.TtlSeconds))).ToList());
    }

    public void Invalidate(string roomId) => store.Invalidate(roomId);

    public bool TryGet(string roomId, out RoomListing listing)
    {
        listing = null!;
        if (!store.TryGet(roomId, out var entry) || entry.ExpiresAt <= clock.GetUtcNow())
            return false;
        listing = entry.Listing;
        return true;
    }

    public IEnumerable<RoomListing> Live()
    {
        var now = clock.GetUtcNow();
        return store.Entries.Where(e => e.ExpiresAt > now).Select(e => e.Listing);
    }
}

public sealed class MainThreadDispatcher
{
    private readonly ConcurrentQueue<Action> _queue = new();

    public void Post(Action action) => _queue.Enqueue(action);

    /// <summary>Runs queued work. Called once per frame on the main thread.</summary>
    public void Drain()
    {
        while (_queue.TryDequeue(out var action))
            action();
    }
}
