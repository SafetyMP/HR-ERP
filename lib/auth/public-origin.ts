/**
 * Resolve the browser-facing origin for auth redirects and callback URLs.
 *
 * Neon Auth (Better Auth) validates `callbackURL` against trusted origins.
 * On Vercel, `request.url` can reflect an internal host while the user browses
 * a production alias or preview URL — use forwarded headers when present.
 */
export function resolvePublicOrigin(request: Request): string {
  const explicit = process.env.AUTH_PUBLIC_ORIGIN?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const headers = request.headers;
  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headers.get("host")?.trim();
  if (host) {
    const proto =
      headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      (process.env.NODE_ENV === "production" ? "https" : "http");
    return `${proto}://${host}`;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const hostOnly = vercelUrl.replace(/^https?:\/\//, "");
    return `https://${hostOnly}`;
  }

  return new URL(request.url).origin;
}

/** Path-only callback for Better Auth social sign-in (resolved against request Origin). */
export const NEON_AUTH_CALLBACK_PATH = "/api/auth/neon/complete";

export function neonAuthCallbackUrl(origin: string): string {
  return `${origin.replace(/\/+$/, "")}${NEON_AUTH_CALLBACK_PATH}`;
}
