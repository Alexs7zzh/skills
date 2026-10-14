import { AsyncLocalStorage } from "node:async_hooks";
const scope = new AsyncLocalStorage<AbortSignal>();
export function currentSignal() {
  const signal = scope.getStore();
  if (!signal) throw new Error("missing dispatch scope");
  return signal;
}
export async function runRequest<T>(body: () => Promise<T>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    return await scope.run(controller.signal, body);
  } finally {
    controller.abort();
    clearTimeout(timer);
  }
}
