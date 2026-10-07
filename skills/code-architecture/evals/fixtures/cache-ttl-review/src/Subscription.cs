namespace Social.Directory;

public interface IPushChannel
{
    IDisposable Subscribe(string topic, Action<string> onMessage);
}

/// <summary>Receives room-closed events and removes the room from both caches.</summary>
public sealed class DirectorySubscription : IDisposable
{
    private readonly IDisposable _handle;
    private readonly MainThreadDispatcher _dispatcher;
    private readonly RoomDirectoryCache _rooms;
    private readonly RoomDirectoryCache _favorites;
    private volatile bool _retired;

    public DirectorySubscription(IPushChannel channel, MainThreadDispatcher dispatcher, RoomDirectoryCache rooms, RoomDirectoryCache favorites)
    {
        _dispatcher = dispatcher;
        _rooms = rooms;
        _favorites = favorites;
        _handle = channel.Subscribe("rooms.closed", OnRoomClosed);
    }

    private void OnRoomClosed(string roomId)
    {
        if (_retired)
            return;

        _dispatcher.Post(() =>
        {
            if (_retired)
                return;
            _rooms.Invalidate(roomId);
            _favorites.Invalidate(roomId);
        });
    }

    /// <summary>Stops acting on events. The channel handle is kept until <see cref="Dispose"/>.</summary>
    public void Retire() => _retired = true;

    /// <summary>Releases the channel subscription.</summary>
    public void Dispose() => _handle.Dispose();
}
