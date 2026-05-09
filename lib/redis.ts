import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis | null };

/**
 * Shared Redis connection for cache helpers (read-through only; never source of truth).
 */
export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    return null;
  }

  if (globalForRedis.redis !== undefined) {
    return globalForRedis.redis;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  globalForRedis.redis = client;
  return client;
}
