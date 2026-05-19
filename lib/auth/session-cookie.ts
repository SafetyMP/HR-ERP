/**
 * HttpOnly session cookie carrying an HR-shaped access JWT (BFF pattern).
 * Browser clients use `credentials: "include"`; APIs accept Bearer header or this cookie.
 */

export const HRERP_SESSION_COOKIE = "hrerp_session";

const MAX_AGE_SECONDS = 60 * 60 * 8; // 8h — align with typical IdP access token TTL

export function parseSessionTokenFromCookieHeader(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${HRERP_SESSION_COOKIE}=`)) continue;
    const raw = trimmed.slice(HRERP_SESSION_COOKIE.length + 1);
    if (!raw) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

export function buildSessionSetCookieHeader(accessToken: string): string {
  const encoded = encodeURIComponent(accessToken.trim());
  const secure =
    process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${HRERP_SESSION_COOKIE}=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}${secure}`;
}

export function buildSessionClearCookieHeader(): string {
  const secure =
    process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${HRERP_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
