import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { Pool } from "pg";

type PrismaGlobal = {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
  prismaRead: PrismaClient | undefined;
  readPool: Pool | undefined;
  prismaBatch: PrismaClient | undefined;
  batchPool: Pool | undefined;
};

const globalForPrisma = globalThis as unknown as PrismaGlobal;

function poolMax(envKey: string, fallback: number): number {
  const raw = process.env[envKey];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function createPool(connectionString: string, max: number): Pool {
  return new Pool({
    connectionString,
    max,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

function createPrismaClient(pool: Pool): PrismaClient {
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function getOrCreatePool(
  key: "pool" | "readPool" | "batchPool",
  connectionString: string,
  max: number,
): Pool {
  const existing = globalForPrisma[key];
  if (existing) return existing;

  const pool = createPool(connectionString, max);
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma[key] = pool;
  }
  return pool;
}

function getOrCreateClient(
  clientKey: "prisma" | "prismaRead" | "prismaBatch",
  poolKey: "pool" | "readPool" | "batchPool",
  connectionString: string,
  max: number,
): PrismaClient {
  const existing = globalForPrisma[clientKey];
  if (existing) return existing;

  const pool = getOrCreatePool(poolKey, connectionString, max);
  const client = createPrismaClient(pool);
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma[clientKey] = client;
  }
  return client;
}

function requireDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return connectionString;
}

function getPrimaryPrisma(): PrismaClient {
  return getOrCreateClient(
    "prisma",
    "pool",
    requireDatabaseUrl(),
    poolMax("PG_POOL_MAX", 20),
  );
}

/** Read replica when `DATABASE_READ_URL` is set; otherwise primary (ADR 0004 mitigation). */
function getReadPrisma(): PrismaClient {
  const readUrl = process.env.DATABASE_READ_URL?.trim();
  if (!readUrl) {
    return getPrimaryPrisma();
  }
  return getOrCreateClient(
    "prismaRead",
    "readPool",
    readUrl,
    poolMax("PG_POOL_MAX_READ", 10),
  );
}

/** Smaller pool for payroll batch / report workloads (ADR 0004 per-route pool tuning). */
function getBatchPrisma(): PrismaClient {
  return getOrCreateClient(
    "prismaBatch",
    "batchPool",
    requireDatabaseUrl(),
    poolMax("PG_POOL_MAX_BATCH", 5),
  );
}

function lazyProxy(getClient: () => PrismaClient): PrismaClient {
  return new Proxy({} as PrismaClient, {
    get(_target, prop, _receiver) {
      const client = getClient();
      const value = Reflect.get(client, prop, client);
      if (typeof value === "function") {
        return value.bind(client);
      }
      return value;
    },
  });
}

/**
 * Lazily connects on first use so modules can import this file during `next build`
 * without DATABASE_URL (runtime routes and scripts still throw on first query if unset).
 */
export const prisma = lazyProxy(getPrimaryPrisma);

export const prismaRead = lazyProxy(getReadPrisma);

export const prismaBatch = lazyProxy(getBatchPrisma);
