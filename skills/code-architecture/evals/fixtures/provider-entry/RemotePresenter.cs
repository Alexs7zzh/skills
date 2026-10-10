namespace Arena.Remote;

using Kinetic;

/// <summary>Presents a remote puck from the owner's reports. Replaces the engine simulation for remote bodies.</summary>
public sealed class RemoteBody : Body, IReportSink
{
    private PuckReport _latest = new();
    private bool _held;

    public RemoteBody(ISurfaceQuery surfaces) : base(surfaces) { }

    public void OnReport(PuckReport report)
    {
        _latest = report;
        Place(report.Position);
        SetVelocity(report.Velocity);
        _held = report.Velocity == Vector3.Zero;
        // The owner's mode is authoritative; apply it so renderer and audio listeners see it.
        SetMode(report.Mode);
    }

    /// <summary>No gravity, no landing: move along the reported velocity and fit height to a local surface when grounded.</summary>
    public override void Step(float dt)
    {
        if (_held)
        {
            Place(_latest.Position);
            return;
        }
        Position += Velocity * dt;
        if (Mode == TravelMode.Grounded)
        {
            var s = Surfaces.Find(_latest.Position.X, _latest.Position.Y, _latest.Position.Z, SnapReach);
            if (s is { } surface) Position.Y = surface.Height;
        }
    }
}

/// <summary>Owns remote bodies for the lifetime of their relay entries.</summary>
public sealed class RemotePuckRegistry
{
    private readonly Dictionary<uint, RemoteBody> _bodies = new();
    private readonly ISurfaceQuery _surfaces;
    private readonly IArenaRenderer _renderer;

    public RemotePuckRegistry(ISurfaceQuery surfaces, IArenaRenderer renderer)
    {
        _surfaces = surfaces;
        _renderer = renderer;
    }

    public void OnRelayUpdate(uint puckId, PuckReport report)
    {
        if (!_bodies.TryGetValue(puckId, out var body))
        {
            body = new RemoteBody(_surfaces);
            body.ModeChanged += (from, to) => _renderer.OnModeChanged(puckId, from, to);
            _bodies[puckId] = body;
        }
        body.OnReport(report);
    }

    public void OnRelayRemoved(uint puckId)
    {
        if (_bodies.Remove(puckId, out var body)) _renderer.Forget(puckId);
    }

    public void Tick(float dt)
    {
        foreach (var body in _bodies.Values) body.Step(dt);
    }
}

public interface IArenaRenderer
{
    void OnModeChanged(uint puckId, TravelMode from, TravelMode to);
    void Forget(uint puckId);
}
