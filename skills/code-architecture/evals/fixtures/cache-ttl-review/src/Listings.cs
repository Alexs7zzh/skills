using System.Net.Http.Json;

namespace Social.Directory;

/// <summary>One room as returned by the directory service.</summary>
public sealed record RoomListing(string RoomId, string Name, int Occupancy, int TtlSeconds);

public sealed record DirectoryPage(IReadOnlyList<RoomListing> Rooms);

public static class DirectoryPolicy
{
    public static readonly TimeSpan RequestTimeout = TimeSpan.FromSeconds(8);
    public static readonly TimeSpan RefreshInterval = TimeSpan.FromSeconds(60);
}

public interface IDirectoryClient
{
    Task<DirectoryPage> FetchAsync(CancellationToken ct);
}

public interface IFavoriteRooms
{
    bool Contains(string roomId);
}

public sealed class HttpDirectoryClient(HttpClient http) : IDirectoryClient
{
    public async Task<DirectoryPage> FetchAsync(CancellationToken ct)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(DirectoryPolicy.RequestTimeout);
        return await http.GetFromJsonAsync<DirectoryPage>("/v1/rooms", timeout.Token)
               ?? throw new InvalidOperationException("Directory response had no body.");
    }
}

/// <summary>Fetches the directory off the main thread and hands each page to the caches.</summary>
public sealed class DirectoryRefresher(
    IDirectoryClient client,
    MainThreadDispatcher dispatcher,
    RoomDirectoryCache rooms,
    RoomDirectoryCache favorites,
    IFavoriteRooms favoriteRooms,
    ILogger log)
{
    public async Task RunAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(DirectoryPolicy.RefreshInterval);
        do
        {
            try
            {
                var page = await client.FetchAsync(ct);
                dispatcher.Post(() =>
                {
                    rooms.Replace(page.Rooms);
                    favorites.Replace(page.Rooms.Where(r => favoriteRooms.Contains(r.RoomId)).ToList());
                });
            }
            catch (Exception e) when (e is HttpRequestException || (e is OperationCanceledException && !ct.IsCancellationRequested))
            {
                log.LogWarning(e, "Directory refresh skipped");
            }
        }
        while (await timer.WaitForNextTickAsync(ct));
    }
}
