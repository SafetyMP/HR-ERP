import { NextResponse } from "next/server";

import { neonAuthConfigured } from "@/lib/auth/neon-auth-config";

export const dynamic = "force-dynamic";

function safeReturnTo(raw: string | null): string {
  if (!raw) return "/";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

function authReturnCookie(returnTo: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `hrerp_auth_return=${encodeURIComponent(returnTo)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`;
}

/**
 * Starts Google OAuth through the Neon Auth **proxy** (`/api/neon-auth/*`) so
 * session cookies are set on this host (required before `/api/auth/neon/complete`).
 *
 * `callbackURL` must match a Neon Auth trusted origin exactly (no query string).
 * `returnTo` is stored in `hrerp_auth_return` and read in `/api/auth/neon/complete`.
 */
export async function GET(request: Request) {
  if (!neonAuthConfigured()) {
    return NextResponse.json({ error: "neon_auth_not_configured" }, { status: 501 });
  }

  const url = new URL(request.url);
  const returnTo = safeReturnTo(url.searchParams.get("returnTo"));
  const origin = url.origin;
  const callbackURL = `${origin}/api/auth/neon/complete`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Signing in…</title>
</head>
<body>
  <p>Redirecting to Google sign-in…</p>
  <script>
    (async () => {
      const callbackURL = ${JSON.stringify(callbackURL)};
      try {
        const res = await fetch("/api/neon-auth/sign-in/social", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "google", callbackURL }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = body.message || body.error || res.statusText || "Sign-in failed";
          document.body.innerHTML = "<p><strong>Sign-in failed</strong></p><pre></pre>";
          document.querySelector("pre").textContent = typeof msg === "string" ? msg : JSON.stringify(msg, null, 2);
          return;
        }
        if (body.url) {
          window.location.href = body.url;
          return;
        }
        document.body.textContent = "Sign-in failed: missing redirect URL from auth service.";
      } catch (e) {
        document.body.textContent = "Sign-in failed: " + (e && e.message ? e.message : String(e));
      }
    })();
  </script>
</body>
</html>`;

  const headers = new Headers({ "Content-Type": "text/html; charset=utf-8" });
  headers.append("Set-Cookie", authReturnCookie(returnTo));

  return new NextResponse(html, { headers });
}
