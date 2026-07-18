import { NextResponse } from "next/server";

import { demoPreviewSignInServerEnabled } from "@/lib/auth/demo-preview";
import { neonAuthConfigured } from "@/lib/auth/neon-auth-config";
import { oidcConfigured } from "@/lib/auth/oidc-session";

/**
 * Single sign-in entry: enterprise OIDC when configured, otherwise Neon Auth (Google).
 */
function safeReturnTo(raw: string | null): string {
  const value = raw?.trim() || "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = safeReturnTo(url.searchParams.get("returnTo"));
  const q = `returnTo=${encodeURIComponent(returnTo)}`;

  if (oidcConfigured()) {
    return NextResponse.redirect(new URL(`/api/auth/oidc/login?${q}`, request.url));
  }

  if (neonAuthConfigured()) {
    return NextResponse.redirect(new URL(`/api/auth/neon/login?${q}`, request.url));
  }

  if (demoPreviewSignInServerEnabled()) {
    return NextResponse.redirect(new URL(`/?${q}`, request.url));
  }

  return NextResponse.json(
    {
      error: "sign_in_not_configured",
      hint: "Set OIDC_ISSUER, OIDC_CLIENT_ID, and OIDC_REDIRECT_URI - or NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET on Vercel.",
    },
    { status: 501 },
  );
}
