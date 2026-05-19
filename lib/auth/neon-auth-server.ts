import { createNeonAuth } from "@neondatabase/auth/next/server";

import { neonAuthConfigured } from "@/lib/auth/neon-auth-config";

function requireNeonAuthConfig() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim();
  const secret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();
  if (!baseUrl || !secret) {
    throw new Error("NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET are required");
  }
  if (secret.length < 32) {
    throw new Error("NEON_AUTH_COOKIE_SECRET must be at least 32 characters");
  }
  return { baseUrl, secret };
}

/** Lazily created so builds without Neon Auth env do not throw at import time. */
let neonAuthInstance: ReturnType<typeof createNeonAuth> | null = null;

export function getNeonAuth() {
  if (!neonAuthConfigured()) {
    throw new Error("neon_auth_not_configured");
  }
  if (!neonAuthInstance) {
    const { baseUrl, secret } = requireNeonAuthConfig();
    neonAuthInstance = createNeonAuth({
      baseUrl,
      cookies: { secret },
    });
  }
  return neonAuthInstance;
}
