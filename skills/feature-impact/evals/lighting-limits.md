# Room brightness limits source bundle

A lighting app now lets users set a brightness ceiling for each room. Previously the requested brightness was also the delivered brightness. The app keeps each lamp's requested percentage so raising a ceiling can restore the user's preference. A ceiling applies to every output command, including after a vacant room becomes occupied again. The controller's ordinary adjustment path already implements the ceiling. Only the following sources are available.

Each lamp has `roomId`, `requestedPercent`, `deliveredPercent`, `fullPowerWatts`, and `suspended`. Room ceilings default to 100. The fixture treats lamp power as proportional to delivered brightness and ignores idle power. Vacancy suspension already existed before this change.

## lighting/controller.ts

```typescript
function publish(lamp, percent) {
  bridge.writeBrightness(lamp.id, percent);
  lamp.deliveredPercent = percent;
}

export function reconcile(lamp) {
  if (lamp.suspended) return;
  publish(lamp, Math.min(lamp.requestedPercent, roomCeilings.get(lamp.roomId)));
}

export function setRequested(lamp, percent) {
  lamp.requestedPercent = percent;
  reconcile(lamp);
}

export function setRoomCeiling(roomId, percent) {
  roomCeilings.set(roomId, percent);
  lamps.inRoom(roomId).forEach(reconcile);
}

export { publish };
```

## energy/demand.ts

```typescript
export function demandWatts() {
  return lamps.all()
    .filter(lamp => !lamp.suspended)
    .reduce((sum, lamp) => sum + lamp.fullPowerWatts * lamp.requestedPercent / 100, 0);
}
```

## backup/reserve.ts

```typescript
import { demandWatts } from '../energy/demand';

export function minutesRemaining() {
  const watts = demandWatts();
  return watts === 0 ? Infinity : battery.usableWh() / watts * 60;
}

export function enterBackup() {
  if (minutesRemaining() < policy.minimumMinutes) {
    return showMessage('Not enough battery reserve');
  }
  backup.connect();
}
```

## ui/battery-status.ts

```typescript
import { minutesRemaining } from '../backup/reserve';

export function renderBatteryStatus() {
  return `${Math.floor(minutesRemaining())} minutes remaining at current brightness`;
}
```

## occupancy/vacancy.ts

```typescript
import { publish } from '../lighting/controller';

const sleeping = new Map();

export function suspendRoom(roomId) {
  for (const lamp of lamps.inRoom(roomId)) {
    sleeping.set(lamp.id, lamp.deliveredPercent);
    lamp.suspended = true;
    publish(lamp, 0);
  }
}

export function resumeRoom(roomId) {
  for (const lamp of lamps.inRoom(roomId)) {
    lamp.suspended = false;
    publish(lamp, sleeping.get(lamp.id));
    sleeping.delete(lamp.id);
  }
}
```

Assume one suspend followed by one resume per room, with no overlapping calls. A user can change the room ceiling while the room is suspended. No reconciliation runs after `resumeRoom` until the next user adjustment.

## scenes/recall.ts

```typescript
import { setRequested } from '../lighting/controller';

export function saveScene(name) {
  scenes.save(name, lamps.all().map(lamp => [lamp.id, lamp.requestedPercent]));
}

export function recallScene(name) {
  for (const [id, percent] of scenes.load(name)) {
    setRequested(lamps.get(id), percent);
  }
}
```

## ui/brightness-slider.ts

```typescript
export function sliderValue(lamp) {
  return lamp.requestedPercent;
}
```

The slider is labelled "Requested brightness". Scenes store user preferences, not snapshots of delivered output.

## energy/live-meter.ts

```typescript
export async function measuredWatts() {
  return (await bridge.readPowerMeters()).reduce((sum, meter) => sum + meter.watts, 0);
}
```

The bridge's power-meter readings report actual draw, including any ceiling or suspension.
