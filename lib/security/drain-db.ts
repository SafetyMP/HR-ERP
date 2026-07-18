import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { Pool } from "pg";

type DrainGlobal = {
  drainPrisma?: PrismaClient;
  drainPool?: Pool;
};

const globalForDrain = globalThis as unknown as DrainGlobal;

/**
 * Resolve the BYPASSRLS (or equivalent) DSN for cross-tenant drain polls.
 * Prefers WORKER_DRAIN_DATABASE_URL, then OUTBOX_DATABASE_URL.
 */
export function resolveDrainDatabaseUrl(): string {
  const drain =
    process.env.WORKER_DRAIN_DATABASE_URL?.trim() ||
    process.env.OUTBOX_DATABASE_URL?.trim() ||
    "";
  if (drain) return drain;

  // Local/CI Compose often uses a single superuser DSN; production must set a drain role.
  if (process.env.NODE_ENV !== "production") {
    const app = process.env.DATABASE_URL?.trim();
    if (app) return app;
  }

  throw new Error(
    "WORKER_DRAIN_DATABASE_URL (or OUTBOX_DATABASE_URL) is required for drain-role clients",
  );
}

/**
 * In production, drain DSN must differ from the app DSN unless explicitly allowed
 * (local Compose superuser often shares one URL).
 */
export function assertDrainUrlDistinctFromApp(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.ALLOW_DRAIN_SAME_AS_APP === "1") return;

  const app = process.env.DATABASE_URL?.trim() ?? "";
  const drain = resolveDrainDatabaseUrl();
  if (app && drain === app) {
    throw new Error(
      "WORKER_DRAIN_DATABASE_URL must differ from DATABASE_URL in production (set ALLOW_DRAIN_SAME_AS_APP=1 only for local superuser)",
    );
  }
}

function createDrainClient(connectionString: string): PrismaClient {
  const pool = new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX_DRAIN ?? "8") || 8,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") {
    globalForDrain.drainPool = pool;
    globalForDrain.drainPrisma = client;
  }
  return client;
}

/** Cross-tenant drain Prisma client (BYPASSRLS role). */
export function getDrainPrisma(): PrismaClient {
  assertDrainUrlDistinctFromApp();
  if (globalForDrain.drainPrisma) return globalForDrain.drainPrisma;
  return createDrainClient(resolveDrainDatabaseUrl());
}
