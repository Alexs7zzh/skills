using Access.Permissions.Persistence;

namespace Access.Permissions;

public sealed class PermissionModule
{
    private readonly GrantRelay _relay;
    private readonly PermissionCache _cache;
    private readonly IPermissionStore _store;

    public PermissionGate Gate { get; }
    public ReplicationOutbox Outbox { get; }

    public PermissionModule(IAuthorizationClient auth, IScopeCipher cipher, string connectionString, TimeProvider clock)
    {
        var policy = new GrantPolicy();

        _store = new EncryptedPermissionStore(new SqlitePermissionStore(connectionString, clock), cipher);
        Outbox = new ReplicationOutbox();
        _store.Subscribe(Outbox);

        _relay = new GrantRelay(auth, _store, policy);
        _cache = new PermissionCache(_relay.Reader, policy, clock);
        Gate = new PermissionGate(_cache, clock);
    }

    public Task RefreshAsync(SubjectId subject, CancellationToken ct) => _relay.RefreshAsync(subject, ct);

    public Task<PermissionRecord?> ReadStoredAsync(SubjectId subject, CancellationToken ct) => _store.ReadAsync(subject, ct);

    /// <summary>Called once per tick on the game thread.</summary>
    public void Tick() => _cache.Pump();

    /// <summary>Stops accepting grants, delivers the ones already relayed, then releases the store.</summary>
    public async Task ShutdownAsync()
    {
        _relay.Complete();
        _cache.Pump();
        await _store.DisposeAsync();
    }
}
