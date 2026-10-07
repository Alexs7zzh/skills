using System.Threading.Channels;
using Access.Permissions.Persistence;

namespace Access.Permissions;

public readonly record struct SubjectId(Guid Value);

/// <summary>Result of one evaluation by the authorization service.</summary>
public sealed record PermissionGrant(SubjectId Subject, IReadOnlySet<string> Scopes, DateTimeOffset EvaluatedAt, DateTimeOffset ExpiresAt);

public interface IAuthorizationClient
{
    Task<PermissionGrant> EvaluateAsync(SubjectId subject, CancellationToken ct);
}

public sealed class GrantPolicy
{
    public TimeSpan MaxGrantAge { get; init; } = TimeSpan.FromSeconds(30);
    public int RelayCapacity { get; init; } = 256;
}

/// <summary>Evaluates grants, records them, and carries them to the game thread.</summary>
public sealed class GrantRelay(IAuthorizationClient auth, IPermissionStore store, GrantPolicy policy)
{
    private readonly Channel<PermissionGrant> _channel = Channel.CreateBounded<PermissionGrant>(
        new BoundedChannelOptions(policy.RelayCapacity) { FullMode = BoundedChannelFullMode.Wait, SingleReader = true });

    public ChannelReader<PermissionGrant> Reader => _channel.Reader;

    public async Task RefreshAsync(SubjectId subject, CancellationToken ct)
    {
        var grant = await auth.EvaluateAsync(subject, ct);
        await store.WriteAsync(new PermissionRecord(grant.Subject, grant.Scopes, grant.ExpiresAt), ct);
        await _channel.Writer.WriteAsync(grant, ct);
    }

    public void Complete() => _channel.Writer.TryComplete();
}
