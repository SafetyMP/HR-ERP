import { createHash } from "node:crypto";

import { requireScimBinding, type ScimTenantBinding } from "@/lib/scim/auth";
import {
  assertScimRateLimitAsync,
  scimRateLimitHeaders,
} from "@/lib/scim/rate-limit";

/** Bucket key available before token validation (throttles failed guesses). */
function scimPreAuthBucketKey(request: Request): string {
  const auth = request.headers.get("authorization") ?? "";
  if (auth.length > 0) {
    const digest = createHash("sha256").update(auth).digest("hex").slice(0, 24);
    return `preauth:${digest}`;
  }
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `preauth:anon:${fwd || "unknown"}`;
}

export async function guardScimRequest(request: Request): Promise<{
  binding: ScimTenantBinding;
  rateLimitHeaders: Record<string, string>;
}> {
  const preKey = scimPreAuthBucketKey(request);
  await assertScimRateLimitAsync(preKey);
  const binding = requireScimBinding(request);
  await assertScimRateLimitAsync(binding.tenantId);
  return { binding, rateLimitHeaders: scimRateLimitHeaders(binding.tenantId) };
}
