/** True when Neon Auth proxy sign-in is configured (Vercel + Neon integration). */
export function neonAuthConfigured(): boolean {
  const base = process.env.NEON_AUTH_BASE_URL?.trim();
  const secret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();
  return Boolean(base && secret && secret.length >= 32);
}

export function neonAuthBaseUrl(): string {
  const base = process.env.NEON_AUTH_BASE_URL?.trim();
  if (!base) {
    throw new Error("NEON_AUTH_BASE_URL is required when Neon Auth is enabled");
  }
  return base.replace(/\/+$/, "");
}
