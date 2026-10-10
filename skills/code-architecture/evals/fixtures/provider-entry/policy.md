# Remote puck presentation policy

Governing requirements for the client-side presentation of remote pucks in
the arena prototype. Authority: design ruling of 2026-03 and the Kinetic
engine contract the project builds against. Source behavior is in the code,
not here.

## Ownership

- Each client owns the puck it controls and reports its position, velocity
  and travel mode (`Grounded`, `Airborne`, `Sliding`). The server relays the
  latest report; it runs no physics and knows no geometry.
- Clients stream arena tiles around their own puck. A remote puck can be
  visible while the tile under it is not loaded on the observer.

## Observer rules

- Ruling 2026-03: an observer presents a remote puck's mode and vertical
  state exactly as reported. Local tile geometry may not change a remote
  puck's mode, pull it onto a local surface, or apply gravity to it. A
  remote puck shown hovering over a missing tile is an accepted mismatch.
- A remote puck whose owner reports zero velocity is held at the reported
  position until the next report. Unchanged reports are not resent.
- Local surface following is allowed only to fit the presented height to a
  surface that exists under the *reported* position within the engine's
  snap reach above or below the reported height, and only while the owner
  reports `Grounded`. A surface further below is a different surface, and
  fitting to it is pulling.

## Engine contract

- Kinetic is the project's engine; its routines are not an adapted
  provider. The engine's `Body` is the only representation of a puck's
  position, velocity and mode that renderers and audio read.
- Accepted tradeoff: the engine's mode-change listener, the renderer, stays
  bound to `Body.ModeChanged`; the project does not duplicate that event.
