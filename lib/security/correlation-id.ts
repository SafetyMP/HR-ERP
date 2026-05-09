/** Edge-safe correlation id — keep free of Node-only imports (middleware runs on Edge). */
export function readCorrelationId(request: Request): string {
  const raw = request.headers.get("x-correlation-id")?.trim();
  if (raw && raw.length <= 128) return raw;
  return globalThis.crypto.randomUUID();
}
