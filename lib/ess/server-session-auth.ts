import { cookies } from "next/headers";

import { parseSessionTokenFromCookieHeader } from "@/lib/auth/session-cookie";
import type { AuthContext } from "@/lib/security/auth-context";
import { claimsToAuthContext, verifyHrJwt } from "@/lib/security/jwt";

/**
 * Resolve AuthContext from the HttpOnly session cookie (RSC prefetch).
 * Returns null when unauthenticated — client components handle sign-in.
 */
export async function getServerSessionAuth(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const token = parseSessionTokenFromCookieHeader(cookieStore.toString());
  if (!token) return null;

  try {
    const claims = await verifyHrJwt(token);
    return claimsToAuthContext(claims, "rsc-prefetch");
  } catch {
    return null;
  }
}
