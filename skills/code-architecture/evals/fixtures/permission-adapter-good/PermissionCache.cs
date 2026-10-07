using System.Threading.Channels;

namespace Access.Permissions;

public sealed record CachedGrant(SubjectId Subject, IReadOnlySet<string> Scopes, DateTimeOffset EvaluatedAt, DateTimeOffset ExpiresAt);

/// <summary>Game-thread view of the latest grant per subject.</summary>
public sealed class PermissionCache(ChannelReader<PermissionGrant> relay)
{
    private readonly Dictionary<SubjectId, CachedGrant> _entries = new();

    /// <summary>Drains the relay. Called once per tick on the game thread.</summary>
    public void Pump()
    {
        while (relay.TryRead(out var grant))
            Accept(grant);
    }

    public void Accept(PermissionGrant grant) =>
        _entries[grant.Subject] = new CachedGrant(grant.Subject, grant.Scopes, grant.EvaluatedAt, grant.ExpiresAt);

    public bool TryGet(SubjectId subject, out CachedGrant grant) => _entries.TryGetValue(subject, out grant!);
}

public sealed class PermissionGate(PermissionCache cache, TimeProvider clock)
{
    public bool Allows(SubjectId subject, string scope) =>
        cache.TryGet(subject, out var grant)
        && grant.ExpiresAt > clock.GetUtcNow()
        && grant.Scopes.Contains(scope);
}
