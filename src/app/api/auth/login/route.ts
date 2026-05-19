import { NextResponse } from "next/server";

import { neonAuthConfigured } from "@/lib/auth/neon-auth-config";
import { oidcConfigured } from "@/lib/auth/oidc-session";

/**
 * Single sign-in entry: enterprise OIDC when configured, otherwise Neon Auth (Google).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo")?.trim() || "/";
  const q = `returnTo=${encodeURIComponent(returnTo)}`;

  if (oidcConfigured()) {
    return NextResponse.redirect(new URL(`/api/auth/oidc/login?${q}`, request.url));
  }

  if (neonAuthConfigured()) {
    return NextResponse.redirect(new URL(`/api/auth/neon/login?${q}`, request.url));
  }

  return NextResponse.json(
    {
      error: "sign_in_not_configured",
      hint: "Set OIDC_ISSUER, OIDC_CLIENT_ID, and OIDC_REDIRECT_URI — or NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET on Vercel.",
    },
    { status: 501 },
  );
}
