using System;

namespace Acme.Realtime.Diagnostics;

/// <summary>Log level as reported by the vendor transport SDK.</summary>
public enum NativeLogLevel
{
    Verbose,
    Info,
    Warning,
    Error,
    Fatal,
}

/// <summary>One entry from the SDK's log callback.</summary>
public sealed record TransportLogEvent(
    string Category,
    string Message,
    NativeLogLevel NativeLevel,
    DateTimeOffset ObservedAt);

public interface ITransportLogSource
{
    event Action<TransportLogEvent> Emitted;
}

internal static class TransportSignatures
{
    public const string ConnectionCategory = "Transport.Connection";
    public const string ConnectionFailurePrefix = "Connection attempt failed";

    public const string NegotiationCategory = "Transport.Negotiation";
    public const string ProtocolDowngradePrefix = "Protocol downgraded to";

    public static bool IsConnectionFailure(TransportLogEvent evt) =>
        evt.Category == ConnectionCategory
        && evt.Message.StartsWith(ConnectionFailurePrefix, StringComparison.Ordinal);

    public static bool IsProtocolDowngrade(TransportLogEvent evt) =>
        evt.Category == NegotiationCategory
        && evt.Message.StartsWith(ProtocolDowngradePrefix, StringComparison.Ordinal);
}
