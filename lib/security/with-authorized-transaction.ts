import {
  Prisma,
  PrismaClient,
} from "@/app/generated/prisma/client";

import type { AuthContext } from "@/lib/security/auth-context";
import type { AbacConstraints, DataClassification } from "@/lib/security/abac-attributes";
import type { Permission } from "@/lib/security/permissions";
import {
  assertAbac,
  assertPermission,
  assertTenantScopedSubject,
} from "@/lib/security/policy-engine";

export interface AuthorizedTxOptions {
  permission: Permission;
  abac?: AbacConstraints;
  /** Classification of rows touched by the transaction (defaults to internal). */
  resourceClassification?: DataClassification;
  /** Optional interactive-transaction tuning (e.g. Serializable for contentious HR writes). */
  prismaTx?: {
    isolationLevel?: Prisma.TransactionIsolationLevel;
    maxWait?: number;
    timeout?: number;
  };
}

/**
 * Enforces RBAC + ABAC, sets transaction-local GUCs for RLS, then runs caller logic.
 */
export async function withAuthorizedTransaction<T>(
  prisma: PrismaClient,
  auth: AuthContext,
  opts: AuthorizedTxOptions,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  assertTenantScopedSubject(auth);
  assertPermission(auth, opts.permission);
  assertAbac(auth, opts.abac, opts.resourceClassification ?? "internal");

  const { isolationLevel, maxWait, timeout } = opts.prismaTx ?? {};
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
      Prisma.sql`SELECT set_config('app.tenant_id', ${auth.tenantId}, true)`,
    );
    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('app.subject_id', ${auth.subjectId}, true)`,
    );
    return fn(tx);
  };

  if (txOptions !== undefined) {
    return prisma.$transaction(run, txOptions);
  }

  return prisma.$transaction(run);
}
