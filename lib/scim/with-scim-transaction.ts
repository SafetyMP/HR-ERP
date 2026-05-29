import { Prisma } from "@/app/generated/prisma/client";
import type { PrismaClient } from "@/app/generated/prisma/client";

import type { ScimTenantBinding } from "@/lib/scim/auth";

const SCIM_SUBJECT_ID = "scim-provisioner";

/**
 * Sets Postgres RLS session GUCs for SCIM machine provisioning (tenant isolation only).
 * SCIM bearer tokens are validated separately via requireScimBinding.
 */
export async function withScimTransaction<T>(
  prisma: PrismaClient,
  binding: ScimTenantBinding,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('app.tenant_id', ${binding.tenantId}, true)`,
    );
    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('app.subject_id', ${SCIM_SUBJECT_ID}, true)`,
    );
    return fn(tx);
  });
}
