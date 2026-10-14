import { runRequest, currentSignal } from "./runner";
import { receipt, reminder } from "./mail";
export async function handler(event: { id: string }) {
  return runRequest(async () => {
    await receipt(event.id, currentSignal());
    return reminder(event.id, currentSignal());
  });
}
