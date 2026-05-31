/**
 * Dev JWT pasted into sessionStorage must stay RFC 7230–safe or `fetch` throws
 * `TypeError: Failed to execute 'fetch' on 'Window': Invalid value` when building Headers.
 */
export const HRERP_BEARER_STORAGE_KEY = "hrerp_bearer_token";

export const HRERP_AUTH_SYNC_EVENT = "hrerp:auth-sync";

export function broadcastAuthSync(token: string | null): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(HRERP_AUTH_SYNC_EVENT, { detail: { token } }),
  );
}

export function normalizeDevBearerToken(raw: string): string {
  let s = raw.trim();
  if (!s) return "";
  while (/^Bearer\s+/i.test(s)) {
    s = s.replace(/^Bearer\s+/i, "").trim();
  }
  s = s.replace(/[\r\n\0]/g, "");
  return s.trim();
}

/** Returns normalized token and rewrites sessionStorage when cleanup was needed. */
export function readDevBearerTokenFromSession(): string | null {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    return null;
  }
  const raw = sessionStorage.getItem(HRERP_BEARER_STORAGE_KEY);
  if (!raw) return null;
  const t = normalizeDevBearerToken(raw);
  if (!t) {
    sessionStorage.removeItem(HRERP_BEARER_STORAGE_KEY);
    return null;
  }
  if (raw !== t) {
    sessionStorage.setItem(HRERP_BEARER_STORAGE_KEY, t);
  }
  return t;
}

export function writeDevBearerTokenToSession(raw: string): string {
  const t = normalizeDevBearerToken(raw);
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    return t;
  }
  if (t) sessionStorage.setItem(HRERP_BEARER_STORAGE_KEY, t);
  else sessionStorage.removeItem(HRERP_BEARER_STORAGE_KEY);
  broadcastAuthSync(t || null);
  return t;
}

export function clearDevBearerTokenFromSession(): void {
  if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(HRERP_BEARER_STORAGE_KEY);
  }
  broadcastAuthSync(null);
}
