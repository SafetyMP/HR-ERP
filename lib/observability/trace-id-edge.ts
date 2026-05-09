/**
 * W3C trace id (32 hex) for log correlation. Edge-safe — no Node-only imports.
 * When an upstream sends `traceparent`, we reuse its trace id; otherwise we mint one.
 */
export function readOrCreateTraceId(request: Request): string {
  const tp = request.headers.get("traceparent");
  if (tp) {
    const parts = tp.split("-");
    if (parts.length >= 2 && /^[0-9a-f]{32}$/i.test(parts[1])) {
      return parts[1].toLowerCase();
    }
  }
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}
