export async function readStatus(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  return response.text();
}
