import type { ConnectionOptions } from "bullmq";
import IORedis from "ioredis";

let shared: IORedis | undefined;

export function getRedisConnection(): IORedis {
  if (shared) return shared;
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");
  shared = new IORedis(url, { maxRetriesPerRequest: null });
  return shared;
}

export function bullConnectionOptionsFromEnv(): ConnectionOptions {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");
  return { url };
}
