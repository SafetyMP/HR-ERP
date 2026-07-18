import { ApiError } from "@/lib/api/v1/errors";
import { getRedis } from "@/lib/redis";

/** Per-tenant sliding window. Prefers Redis when REDIS_URL is set; else in-process. */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.SCIM_RATE_LIMIT_PER_MINUTE ?? "120");

type Bucket = { count: number; windowStart: number };
const buckets = new Map<string, Bucket>();

/**
 * Prefer {@link assertScimRateLimitAsync} from request handlers.
 * Sync path is in-process only (used by unit tests / Redis-unavailable fallback).
 */
export function assertScimRateLimit(tenantId: string): void {
  assertScimRateLimitInProcess(tenantId);
}

export async function assertScimRateLimitAsync(tenantId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    assertScimRateLimitInProcess(tenantId);
    return;
  }

  const key = `scim:rl:${tenantId}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.pexpire(key, WINDOW_MS);
  }
  if (count > MAX_REQUESTS) {
    const ttlMs = await redis.pttl(key);
    const retryAfterSec = Math.max(1, Math.ceil((ttlMs > 0 ? ttlMs : WINDOW_MS) / 1000));
    throw new ApiError(429, {
      code: "rate_limited",
      message: "scim_rate_limit_exceeded",
      details: { retryAfterSec },
    });
  }
}

function assertScimRateLimitInProcess(tenantId: string): void {
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
  if (!bucket) {
    return {
      "X-RateLimit-Limit": String(MAX_REQUESTS),
    };
  }
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
