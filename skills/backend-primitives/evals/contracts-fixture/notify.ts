export async function notify(url: string) {
  await fetch(url, { method: "POST", body: "ping" });
}
export const handler = async (event: { target: string }) => notify(event.target);
