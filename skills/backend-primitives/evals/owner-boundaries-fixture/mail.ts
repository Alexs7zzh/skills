export async function deliver(id: string, signal: AbortSignal) {
  const response = await fetch(`https://mail.example/${id}`, { method: "POST", signal });
  if (!response.ok) throw new Error(`mail ${response.status}`);
  return response.text();
}
export async function receipt(id: string, signal: AbortSignal) {
  return deliver(`receipt-${id}`, signal);
}
export async function reminder(id: string, signal: AbortSignal) {
  return deliver(`reminder-${id}`, signal);
}
