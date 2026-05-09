import { Prisma } from "@/app/generated/prisma/client";
import type { PrismaClient } from "@/app/generated/prisma/client";

/**
 * Sets Postgres RLS session GUCs for the tenant (required whenever FORCE ROW LEVEL SECURITY is enabled).
 */
export async function withTenantRls<T>(
  prisma: PrismaClient,
  tenantId: string,
  subjectId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
    );
    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('app.subject_id', ${subjectId}, true)`,
    );
    return fn(tx);
  });
}
