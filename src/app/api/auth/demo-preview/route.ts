import { NextResponse } from "next/server";

import {
  demoPreviewSignInServerEnabled,
  mintDemoPreviewAccessToken,
  parseDemoPreviewPersona,
  DEMO_PREVIEW_PERSONAS,
} from "@/lib/auth/demo-preview";
import { resolvePublicOrigin } from "@/lib/auth/public-origin";
import { buildSessionSetCookieHeader } from "@/lib/auth/session-cookie";

export const dynamic = "force-dynamic";

function safeReturnTo(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return fallback;
}

/**
 * One-click signed-in demo for Preview / local environments.
 * Sets httpOnly session cookie and redirects — no OAuth or JWT paste required.
 */
export async function GET(request: Request) {
  if (!demoPreviewSignInServerEnabled()) {
    return NextResponse.json({ error: "demo_preview_disabled" }, { status: 404 });
  }

  const url = new URL(request.url);
  const persona = parseDemoPreviewPersona(url.searchParams.get("persona"));
  if (!persona) {
    return NextResponse.json(
      { error: "invalid_persona", allowed: ["employee", "manager", "hr"] },
      { status: 400 },
    );
  }

  const spec = DEMO_PREVIEW_PERSONAS[persona];
  const returnTo = safeReturnTo(
    url.searchParams.get("returnTo"),
    spec.defaultReturnTo,
  );

  try {
    const token = await mintDemoPreviewAccessToken(persona);
    const headers = new Headers();
    headers.append("Set-Cookie", buildSessionSetCookieHeader(token));
    return NextResponse.redirect(new URL(returnTo, resolvePublicOrigin(request)), {
      headers,
    });
  } catch {
    return NextResponse.json({ error: "demo_preview_mint_failed" }, { status: 500 });
  }
}
