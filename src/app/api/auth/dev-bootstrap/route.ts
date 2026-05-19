import { NextResponse } from "next/server";

import { buildSessionSetCookieHeader } from "@/lib/auth/session-cookie";
import { verifyHrJwt } from "@/lib/security/jwt";

/**
 * Development-only: set session cookie from `?token=` query (e.g. from issue-dev-jwt.mjs)
 * and redirect to `returnTo` (default `/`).
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_available_in_production" }, { status: 404 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const returnTo = url.searchParams.get("returnTo")?.trim() || "/";

  if (!token) {
    return NextResponse.json({ error: "token_query_required" }, { status: 400 });
  }
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return NextResponse.json({ error: "invalid_return_to" }, { status: 400 });
  }

  try {
    await verifyHrJwt(token);
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const headers = new Headers();
  headers.append("Set-Cookie", buildSessionSetCookieHeader(token));
  return NextResponse.redirect(new URL(returnTo, request.url), { headers });
}
