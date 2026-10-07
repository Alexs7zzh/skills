# Virtualized form source bundle

The settings editor now mounts only fields near the viewport instead of mounting every field. The schema and all draft values remain in the store, including fields that have never been mounted. Saving must submit and validate every schema field. Only the following sources are available.

## editor/field.ts

```typescript
function mountField(id) {
  controls.register(id, {
    read: () => drafts.get(id),
    validate: () => validateValue(schema.get(id), drafts.get(id))
  });
}
function unmountField(id) {
  controls.unregister(id);
}
```

## editor/controls.ts

```typescript
const active = new Map();
export function register(id, control) { active.set(id, control); }
export function unregister(id) { active.delete(id); }
export function values() {
  return Object.fromEntries([...active].map(([id, c]) => [id, c.read()]));
}
export function errors() {
  return [...active].flatMap(([id, c]) => c.validate() ? [] : [id]);
}
```

## commands/save.ts

```typescript
async function save() {
  const errors = controls.errors();
  if (errors.length) return showErrors(errors);
  await api.replaceSettings(controls.values());
}
```

## commands/export-draft.ts

```typescript
function exportDraft() {
  return JSON.stringify(Object.fromEntries(schema.ids().map(id => [id, drafts.get(id)])));
}
```

## editor/search.ts

```typescript
function search(query) { return schema.fields().filter(f => f.label.includes(query)); }
function activateResult(id) {
  virtualizer.scrollTo(id);
  virtualizer.whenMounted(id).then(() => controls.active(id).focus());
}
```

Assume `whenMounted` resolves only when the target is mounted, `active(id)` then exposes the mounted control's `focus` method, and the user remains in this editor for the operation.
