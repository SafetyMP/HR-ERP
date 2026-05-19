import { NextResponse } from "next/server";

import {
  accessTokenForOidcLogin,
  provisionHrSessionFromEmail,
} from "@/lib/auth/provision-session-from-oidc";
import { getNeonAuth } from "@/lib/auth/neon-auth-server";
import { neonAuthConfigured } from "@/lib/auth/neon-auth-config";
import { buildSessionSetCookieHeader } from "@/lib/auth/session-cookie";

export const dynamic = "force-dynamic";

function safeReturnTo(raw: string | null): string {
  if (!raw) return "/";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

function readReturnToFromCookie(cookieHeader: string | null): string {
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

function errorHtml(title: string, detail: string, returnTo: string): string {
  const safeDetail = detail.replace(/</g, "&lt;");
  const safeReturn = returnTo.replace(/"/g, "&quot;");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>${title}</title></head>
<body>
  <h1>${title}</h1>
  <p>${safeDetail}</p>
  <p><a href="/api/auth/login?returnTo=${encodeURIComponent(safeReturn)}">Try sign-in again</a></p>
  <p><a href="/">Home</a></p>
</body>
</html>`;
}

export async function GET(request: Request) {
  if (!neonAuthConfigured()) {
    return NextResponse.json({ error: "neon_auth_not_configured" }, { status: 501 });
  }

  const url = new URL(request.url);
  const returnToParam = url.searchParams.get("returnTo");
  const returnTo = returnToParam
    ? safeReturnTo(returnToParam)
    : readReturnToFromCookie(request.headers.get("cookie"));

  const auth = getNeonAuth();
  const { data: session, error: sessionError } = await auth.getSession();

  if (sessionError || !session?.user) {
    return new NextResponse(
      errorHtml(
        "Sign-in incomplete",
        "No Neon Auth session was found after Google sign-in. Complete the Google prompt, then try again.",
        returnTo,
      ),
      { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const email =
    typeof session.user.email === "string" ? session.user.email : null;

  try {
    let hrToken: string;
    if (email) {
      hrToken = await provisionHrSessionFromEmail(email);
    } else {
      const { data: tokenData, error: tokenError } = await auth.getAccessToken({
        providerId: "google",
      });
      const accessToken =
        tokenData?.accessToken ?? tokenData?.idToken ?? session.session?.token ?? null;
      if (tokenError || !accessToken) {
        throw new Error("neon_no_access_token");
      }
      hrToken = await accessTokenForOidcLogin(accessToken);
    }

    const headers = new Headers();
    headers.append("Set-Cookie", buildSessionSetCookieHeader(hrToken));
    headers.append(
      "Set-Cookie",
      "hrerp_auth_return=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    );
    return NextResponse.redirect(new URL(returnTo, request.url), { headers });
  } catch (err) {
    const code = err instanceof Error ? err.message : "neon_provision_failed";
    const detail =
      code === "oidc_user_not_provisioned"
        ? `Your Google account (${email ?? "unknown email"}) is not provisioned in HR ERP. Ask an administrator to add your user with roles in the database.`
        : code === "oidc_user_no_roles"
          ? "Your account exists but has no HR roles assigned."
          : code;
    return new NextResponse(errorHtml("Sign-in blocked", detail, returnTo), {
      status: 403,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
