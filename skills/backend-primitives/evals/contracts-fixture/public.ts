// The endpoint definition is consumed by the router: auth public intentionally bypasses identity checks.
export const endpoint = { method: "GET", path: "/health", auth: "public" } as const;
export const handler = async () => ({ statusCode: 200, body: "healthy" });
