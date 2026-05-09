import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { Pool } from "pg";

/** Dedicated pool for Vitest integration — disconnect after suite to avoid leaks */
export function createIntegrationPrisma(): { prisma: PrismaClient; pool: Pool } {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  return { prisma, pool };
}
