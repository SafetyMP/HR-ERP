import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time comparison of high-entropy secrets presented as Bearer tokens.
 * Compares SHA-256 digests so lengths need not match (avoids early-return timing on length).
 */
export function verifyBearerIssuerSecret(
  authorizationHeader: string | null,
  expectedSecret: string | undefined,
): boolean {
  if (!expectedSecret || expectedSecret.length < 32) return false;
  if (!authorizationHeader?.startsWith("Bearer ")) return false;
  const presented = authorizationHeader.slice("Bearer ".length).trim();
  if (!presented || presented.length < 32) return false;

  const a = createHash("sha256").update(presented, "utf8").digest();
  const b = createHash("sha256").update(expectedSecret, "utf8").digest();
  return timingSafeEqual(a, b);
}
