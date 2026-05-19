import { NextResponse } from "next/server";

import {
  buildSessionClearCookieHeader,
  buildSessionSetCookieHeader,
  parseSessionTokenFromCookieHeader,
} from "@/lib/auth/session-cookie";
import { verifyHrJwt } from "@/lib/security/jwt";

export async function GET(request: Request) {
  const token = parseSessionTokenFromCookieHeader(request.headers.get("cookie"));
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }
  try {
    await verifyHrJwt(token);
    return NextResponse.json({ authenticated: true, mode: "cookie" });
  } catch {
    const headers = new Headers();
    headers.append("Set-Cookie", buildSessionClearCookieHeader());
    return NextResponse.json(
      { authenticated: false },
      { headers },
    );
  }
}

/** Establish an httpOnly session (development bootstrap or trusted BFF exchange). */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SESSION_TOKEN_POST !== "true") {
    return NextResponse.json(
      { error: "session_post_disabled_in_production" },
      { status: 403 },
    );
  }
  const body = (await request.json()) as { accessToken?: string };
  const accessToken = body.accessToken?.trim();
  if (!accessToken) {
    return NextResponse.json({ error: "access_token_required" }, { status: 400 });
  }
  try {
    await verifyHrJwt(accessToken);
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }
  const headers = new Headers();
  headers.append("Set-Cookie", buildSessionSetCookieHeader(accessToken));
  return NextResponse.json({ authenticated: true }, { headers });
}

export async function DELETE() {
  const headers = new Headers();
  headers.append("Set-Cookie", buildSessionClearCookieHeader());
  return NextResponse.json({ authenticated: false }, { headers });
}
