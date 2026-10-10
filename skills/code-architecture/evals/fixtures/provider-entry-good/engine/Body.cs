// Kinetic engine, version 3.2. Project code builds against this source.
namespace Kinetic;

public enum TravelMode { None, Grounded, Airborne, Sliding }

public readonly record struct Surface(float Height, int TileId);

public interface ISurfaceQuery
{
    /// <summary>Finds the highest loaded surface under (x, z) at or below y + reach. There is no lower bound.</summary>
    Surface? Find(float x, float y, float z, float reach);
}

/// <summary>A simulated body. Mode, velocity and position are the fields renderers read.</summary>
public class Body
{
    public const float SnapReach = 0.6f;
    public const float Gravity = -9.8f;

    public TravelMode Mode { get; private set; } = TravelMode.None;
    public Vector3 Position;
    public Vector3 Velocity;
    public Surface? CurrentSurface { get; protected set; }

    public event Action<TravelMode, TravelMode>? ModeChanged;

    protected ISurfaceQuery Surfaces { get; }

    public Body(ISurfaceQuery surfaces) { Surfaces = surfaces; }

    /// <summary>Sets the travel mode and runs the mode's entry work.</summary>
    public void SetMode(TravelMode mode)
    {
        if (mode == Mode) return;
        var previous = Mode;
        Mode = mode;
        OnModeEntered(previous);
        ModeChanged?.Invoke(previous, mode);
    }

    /// <summary>Entry work for the new mode. Grounded entry fits the body to the surface under it.</summary>
    protected virtual void OnModeEntered(TravelMode previous)
    {
        switch (Mode)
        {
            case TravelMode.Grounded:
                CurrentSurface = Surfaces.Find(Position.X, Position.Y, Position.Z, SnapReach);
                if (CurrentSurface is { } s)
                {
                    Position.Y = s.Height;
                    Velocity.Y = 0f;
                }
                else
                {
                    Mode = TravelMode.Airborne;
                }
                break;
            case TravelMode.Airborne:
            case TravelMode.Sliding:
                CurrentSurface = null;
                break;
            case TravelMode.None:
                Velocity = Vector3.Zero;
                CurrentSurface = null;
                break;
        }
    }

    /// <summary>Advances the body by one step. Override to replace the simulation.</summary>
    public virtual void Step(float dt)
    {
        if (Mode == TravelMode.Grounded)
        {
            Position += Velocity * dt;
            CurrentSurface = Surfaces.Find(Position.X, Position.Y, Position.Z, SnapReach);
            if (CurrentSurface is { } s) Position.Y = s.Height;
            else SetMode(TravelMode.Airborne);
            return;
        }
        Velocity.Y += Gravity * dt;
        Position += Velocity * dt;
        var landing = Surfaces.Find(Position.X, Position.Y, Position.Z, 0f);
        if (landing is { } l && Velocity.Y <= 0f)
        {
            Position.Y = l.Height;
            SetMode(TravelMode.Grounded);
        }
    }

    /// <summary>Teleports the body. No entry work; listeners are not notified.</summary>
    public void Place(Vector3 position) { Position = position; }

    /// <summary>Writes velocity only.</summary>
    public void SetVelocity(Vector3 velocity) { Velocity = velocity; }
}
