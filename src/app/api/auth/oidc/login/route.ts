import { NextResponse } from "next/server";

import {
  buildAuthorizationUrl,
  createOidcState,
  createPkcePair,
  oidcConfigured,
  oidcPkceSetCookieHeader,
  oidcStateSetCookieHeader,
} from "@/lib/auth/oidc-session";

export async function GET(request: Request) {
  if (!oidcConfigured()) {
    return NextResponse.json(
      {
        error: "oidc_not_configured",
        hint: "Set OIDC_ISSUER, OIDC_CLIENT_ID, and OIDC_REDIRECT_URI — or NEON_AUTH_BASE_URL + NEON_AUTH_COOKIE_SECRET on Vercel.",
      },
      { status: 501 },
    );
  }

  const returnTo = new URL(request.url).searchParams.get("returnTo")?.trim() || "/";
  const state = createOidcState();
  const { verifier, challenge } = createPkcePair();
  const authUrl = await buildAuthorizationUrl(state, challenge);

  const headers = new Headers();
  headers.append("Set-Cookie", oidcStateSetCookieHeader(state));
  headers.append("Set-Cookie", oidcPkceSetCookieHeader(verifier));
  headers.append(
    "Set-Cookie",
    `hrerp_auth_return=${encodeURIComponent(returnTo)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
  );

  return NextResponse.redirect(authUrl, { headers });
}
