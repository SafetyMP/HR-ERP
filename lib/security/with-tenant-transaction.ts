import {
  Prisma,
  PrismaClient,
} from "@/app/generated/prisma/client";

/**
 * Sets RLS session GUCs for non-request contexts (workers, jobs).
 * Prefer {@link withAuthorizedTransaction} for HTTP handlers (RBAC+ABAC).
 */
export async function withTenantTransaction<T>(
  prisma: PrismaClient,
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  opts?: {
    subjectId?: string;
    prismaTx?: {
      isolationLevel?: Prisma.TransactionIsolationLevel;
      maxWait?: number;
      timeout?: number;
    };
  },
): Promise<T> {
  if (!tenantId.trim()) {
    throw new Error("withTenantTransaction_requires_tenant_id");
  }

  const subjectId = opts?.subjectId?.trim() || "system:worker";
  const { isolationLevel, maxWait, timeout } = opts?.prismaTx ?? {};
  const txOptions =
    isolationLevel !== undefined || maxWait !== undefined || timeout !== undefined
      ? {
          ...(isolationLevel !== undefined ? { isolationLevel } : {}),
          ...(maxWait !== undefined ? { maxWait } : {}),
          ...(timeout !== undefined ? { timeout } : {}),
        }
      : undefined;

  const run = async (tx: Prisma.TransactionClient) => {
    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
    );
    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('app.subject_id', ${subjectId}, true)`,
    );
    return fn(tx);
  };

  if (txOptions !== undefined) {
    return prisma.$transaction(run, txOptions);
  }
  return prisma.$transaction(run);
}
