export async function readStatus(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
  return response.text();
}
