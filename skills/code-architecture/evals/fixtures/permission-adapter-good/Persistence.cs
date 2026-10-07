using System.Collections.Concurrent;
using Microsoft.Data.Sqlite;

namespace Access.Permissions.Persistence;

public sealed record PermissionRecord(SubjectId Subject, IReadOnlySet<string> Scopes, DateTimeOffset ExpiresAt);
public sealed record CommitRecord(SubjectId Subject, long Sequence, DateTimeOffset CommittedAt);

public interface ICommitListener
{
    void OnCommitted(CommitRecord commit);
}

public interface IPermissionStore : IAsyncDisposable
{
    Task<PermissionRecord?> ReadAsync(SubjectId subject, CancellationToken ct);
    Task WriteAsync(PermissionRecord record, CancellationToken ct);
    void Subscribe(ICommitListener listener);
}

public interface IScopeCipher
{
    IReadOnlySet<string> Encrypt(IReadOnlySet<string> scopes);
    IReadOnlySet<string> Decrypt(IReadOnlySet<string> scopes);
}

/// <summary>Base for stores that decorate another store. Forwards the store contract to the inner store.</summary>
public abstract class PermissionStoreAdapter(IPermissionStore inner) : IPermissionStore
{
    protected IPermissionStore Inner { get; } = inner;

    public virtual Task<PermissionRecord?> ReadAsync(SubjectId subject, CancellationToken ct) => Inner.ReadAsync(subject, ct);
    public virtual Task WriteAsync(PermissionRecord record, CancellationToken ct) => Inner.WriteAsync(record, ct);
    public virtual void Subscribe(ICommitListener listener) => Inner.Subscribe(listener);
    public virtual ValueTask DisposeAsync() => Inner.DisposeAsync();
}

/// <summary>Encrypts scope sets at rest.</summary>
public sealed class EncryptedPermissionStore(IPermissionStore inner, IScopeCipher cipher) : PermissionStoreAdapter(inner)
{
    public override async Task<PermissionRecord?> ReadAsync(SubjectId subject, CancellationToken ct)
    {
        var stored = await Inner.ReadAsync(subject, ct);
        return stored is null ? null : stored with { Scopes = cipher.Decrypt(stored.Scopes) };
    }

    public override Task WriteAsync(PermissionRecord record, CancellationToken ct) =>
        Inner.WriteAsync(record with { Scopes = cipher.Encrypt(record.Scopes) }, ct);
}

public sealed class SqlitePermissionStore : IPermissionStore
{
    private readonly SqliteConnection _connection;
    private readonly TimeProvider _clock;
    private readonly List<ICommitListener> _listeners = new();
    private long _sequence;

    public SqlitePermissionStore(string connectionString, TimeProvider clock)
    {
        _connection = new SqliteConnection(connectionString);
        _connection.Open();
        _clock = clock;
    }

    public async Task<PermissionRecord?> ReadAsync(SubjectId subject, CancellationToken ct)
    {
        await using var cmd = _connection.CreateCommand();
        cmd.CommandText = "SELECT scopes, expires_at FROM grants WHERE subject = $subject";
        cmd.Parameters.AddWithValue("$subject", subject.Value.ToString());

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct))
            return null;

        return new PermissionRecord(subject, reader.GetString(0).Split(' ').ToHashSet(), DateTimeOffset.Parse(reader.GetString(1)));
    }

    public async Task WriteAsync(PermissionRecord record, CancellationToken ct)
    {
        await using var cmd = _connection.CreateCommand();
        cmd.CommandText = "INSERT INTO grants (subject, scopes, expires_at) VALUES ($subject, $scopes, $expires) " +
                          "ON CONFLICT(subject) DO UPDATE SET scopes = excluded.scopes, expires_at = excluded.expires_at";
        cmd.Parameters.AddWithValue("$subject", record.Subject.Value.ToString());
        cmd.Parameters.AddWithValue("$scopes", string.Join(' ', record.Scopes));
        cmd.Parameters.AddWithValue("$expires", record.ExpiresAt.ToString("O"));
        await cmd.ExecuteNonQueryAsync(ct);

        var commit = new CommitRecord(record.Subject, Interlocked.Increment(ref _sequence), _clock.GetUtcNow());
        foreach (var listener in _listeners)
            listener.OnCommitted(commit);
    }

    public void Subscribe(ICommitListener listener) => _listeners.Add(listener);

    public ValueTask DisposeAsync() => _connection.DisposeAsync();
}

/// <summary>Queues commits for the replication sender.</summary>
public sealed class ReplicationOutbox : ICommitListener
{
    private readonly ConcurrentQueue<CommitRecord> _pending = new();

    public void OnCommitted(CommitRecord commit) => _pending.Enqueue(commit);

    public bool TryDequeue(out CommitRecord commit) => _pending.TryDequeue(out commit!);
}
