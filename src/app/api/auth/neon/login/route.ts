import { NextResponse } from "next/server";

import { getNeonAuth } from "@/lib/auth/neon-auth-server";
import { neonAuthConfigured } from "@/lib/auth/neon-auth-config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!neonAuthConfigured()) {
    return NextResponse.json({ error: "neon_auth_not_configured" }, { status: 501 });
  }

  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo")?.trim() || "/";
  const origin = url.origin;
  const callbackURL = `${origin}/api/auth/neon/complete?returnTo=${encodeURIComponent(returnTo)}`;

  const auth = getNeonAuth();
  const { data, error } = await auth.signIn.social({
    provider: "google",
    callbackURL,
  });

  if (error || !data?.url) {
    const message = error?.message ?? "neon_social_sign_in_failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.redirect(data.url);
}
