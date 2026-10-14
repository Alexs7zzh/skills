import { runRequest, currentSignal } from "./runner";
import { receipt, reminder } from "./mail";
export async function handler(event: { id: string }) {
  return runRequest(async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await receipt(event.id, currentSignal());
        return await reminder(event.id, currentSignal());
      } catch (error) {
        if (currentSignal().aborted || attempt === 2) throw error;
      }
    }
  });
}
