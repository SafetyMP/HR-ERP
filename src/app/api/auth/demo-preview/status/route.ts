import { NextResponse } from "next/server";

import { demoPreviewSignInServerEnabled } from "@/lib/auth/demo-preview";

export const dynamic = "force-dynamic";

/** Tells the client whether one-click demo preview sign-in is available on this deployment. */
export async function GET() {
  return NextResponse.json({ enabled: demoPreviewSignInServerEnabled() });
}
