import { ApiError } from "@/lib/api/v1/errors";

/** Per-tenant sliding window (in-process; document for multi-instance deployments). */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.SCIM_RATE_LIMIT_PER_MINUTE ?? "120");

type Bucket = { count: number; windowStart: number };
const buckets = new Map<string, Bucket>();

export function assertScimRateLimit(tenantId: string): void {
  const now = Date.now();
  const bucket = buckets.get(tenantId);
  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(tenantId, { count: 1, windowStart: now });
    return;
  }
  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - bucket.windowStart)) / 1000);
    throw new ApiError(429, {
      code: "rate_limited",
      message: "scim_rate_limit_exceeded",
      details: { retryAfterSec },
    });
  }
}

export function scimRateLimitHeaders(tenantId: string): Record<string, string> {
  const bucket = buckets.get(tenantId);
  if (!bucket) return {};
  const remaining = Math.max(0, MAX_REQUESTS - bucket.count);
  const retryAfterSec = Math.ceil((WINDOW_MS - (Date.now() - bucket.windowStart)) / 1000);
  return {
    "X-RateLimit-Limit": String(MAX_REQUESTS),
    "X-RateLimit-Remaining": String(remaining),
    ...(remaining === 0 ? { "Retry-After": String(Math.max(1, retryAfterSec)) } : {}),
  };
}

/** Test helper */
export function resetScimRateLimitsForTests(): void {
  buckets.clear();
}
