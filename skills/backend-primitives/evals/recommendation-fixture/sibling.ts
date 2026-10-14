// Export API v1 has two deployed clients which read {items, nextCursor}.
export function listResult(items: string[], nextCursor: string | null) {
  return { items, nextCursor };
}
// Export workers are retried. The notification provider has no idempotency key.
export async function notify(send: () => Promise<void>) { await send(); }
// Product contract: health is intentionally available before login.
export function health() { return { status: "ok" }; }
function register(handler: () => unknown, options: {auth?: "none" | "required"} = {}) {
  return { handler, auth: options.auth ?? "none" };
}
export const healthRoute = register(health);
