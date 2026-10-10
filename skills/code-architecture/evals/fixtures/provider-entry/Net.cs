namespace Arena.Remote;

using Kinetic;

/// <summary>The latest report relayed by the server for one remote puck. Fields replicate independently.</summary>
public sealed class PuckReport
{
    public Vector3 Position;
    public Vector3 Velocity;
    public TravelMode Mode;
    public uint Sequence;
}

public interface IReportSink
{
    /// <summary>Called once per relayed update after all fields are applied.</summary>
    void OnReport(PuckReport report);
}
