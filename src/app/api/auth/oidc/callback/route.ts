import { NextResponse } from "next/server";

import { accessTokenForOidcLogin } from "@/lib/auth/provision-session-from-oidc";
import {
  clearOidcTransientCookies,
  exchangeAuthorizationCode,
  oidcConfigured,
  readOidcStateFromCookie,
  readPkceVerifierFromCookie,
} from "@/lib/auth/oidc-session";
import { buildSessionSetCookieHeader } from "@/lib/auth/session-cookie";

function readReturnTo(cookieHeader: string | null): string {
  if (!cookieHeader) return "/";
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith("hrerp_auth_return=")) continue;
    const raw = trimmed.slice("hrerp_auth_return=".length);
    try {
      const path = decodeURIComponent(raw);
      if (path.startsWith("/") && !path.startsWith("//")) return path;
    } catch {
      /* ignore */
    }
  }
  return "/";
}

export async function GET(request: Request) {
  if (!oidcConfigured()) {
    return NextResponse.json({ error: "oidc_not_configured" }, { status: 501 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieHeader = request.headers.get("cookie");
  const expectedState = readOidcStateFromCookie(cookieHeader);
  const verifier = readPkceVerifierFromCookie(cookieHeader);

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return NextResponse.json({ error: "oidc_invalid_callback" }, { status: 400 });
  }

  try {
    const tokens = await exchangeAuthorizationCode(code, verifier);
    const raw = tokens.id_token ?? tokens.access_token;
    if (!raw) {
      return NextResponse.json({ error: "oidc_no_usable_token" }, { status: 502 });
    }
    const sessionToken = await accessTokenForOidcLogin(raw);
    const returnTo = readReturnTo(cookieHeader);
    const headers = new Headers();
    headers.append("Set-Cookie", buildSessionSetCookieHeader(sessionToken));
    for (const cleared of clearOidcTransientCookies()) {
      headers.append("Set-Cookie", cleared);
    }
    headers.append(
      "Set-Cookie",
      "hrerp_auth_return=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    );
    return NextResponse.redirect(new URL(returnTo, request.url), { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "oidc_login_failed";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
