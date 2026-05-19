import { NextResponse } from "next/server";

import { accessTokenForOidcLogin } from "@/lib/auth/provision-session-from-oidc";
import { getNeonAuth } from "@/lib/auth/neon-auth-server";
import { neonAuthConfigured } from "@/lib/auth/neon-auth-config";
import { buildSessionSetCookieHeader } from "@/lib/auth/session-cookie";

export const dynamic = "force-dynamic";

function safeReturnTo(raw: string | null): string {
  if (!raw) return "/";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

export async function GET(request: Request) {
  if (!neonAuthConfigured()) {
    return NextResponse.json({ error: "neon_auth_not_configured" }, { status: 501 });
  }

  const url = new URL(request.url);
  const returnTo = safeReturnTo(url.searchParams.get("returnTo"));

  const auth = getNeonAuth();
  const { data: session, error: sessionError } = await auth.getSession();

  if (sessionError || !session?.user) {
    return NextResponse.json(
      { error: "neon_session_missing", hint: "Complete Google sign-in via Neon Auth first." },
      { status: 401 },
    );
  }

  const { data: tokenData, error: tokenError } = await auth.getAccessToken({
    providerId: "google",
  });
  const accessToken =
    tokenData?.accessToken ?? tokenData?.idToken ?? session.session?.token ?? null;

  if (tokenError || !accessToken) {
    return NextResponse.json({ error: "neon_no_access_token" }, { status: 502 });
  }

  try {
    const hrToken = await accessTokenForOidcLogin(accessToken);
    const headers = new Headers();
    headers.append("Set-Cookie", buildSessionSetCookieHeader(hrToken));
    return NextResponse.redirect(new URL(returnTo, request.url), { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "neon_provision_failed";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
