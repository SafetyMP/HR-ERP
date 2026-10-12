import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/app/generated/prisma/client";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";
import { createIntegrationPrisma } from "@/tests/helpers/integration-prisma";

/**
 * Postgres superusers bypass RLS even when FORCE ROW LEVEL SECURITY is set.
 * CI and docker-compose log in as POSTGRES_USER, which is a superuser, so a
 * read that stayed on that role would not exercise employees_tenant_isolation.
 * This NOLOGIN role has neither SUPERUSER nor BYPASSRLS.
 */
const RLS_PROBE_ROLE = "hr_erp_rls_probe";

const hasDb = Boolean(process.env.DATABASE_URL);

function authFor(tenantId: string): AuthContext {
  return {
    subjectId: `rls-probe:${tenantId}`,
    tenantId,
    roles: ["hr_admin"],
    mfaLevel: "none",
    correlationId: "employee-rls-cross-tenant",
  };
}

describe.skipIf(!hasDb)("employee RLS cross-tenant read (integration)", () => {
  let prisma: PrismaClient;
  let pool: Pool;
  let tenantA: string;
  let tenantB: string;
  let employeeAId: string;
  let useProbeRole: boolean;

  beforeAll(async () => {
    const created = createIntegrationPrisma();
    prisma = created.prisma;
    pool = created.pool;

    const bypassRows = await prisma.$queryRaw<Array<{ bypass: boolean }>>`
      SELECT (rolsuper OR rolbypassrls) AS bypass
      FROM pg_roles
      WHERE rolname = current_user
    `;
    useProbeRole = Boolean(bypassRows[0]?.bypass);
    if (useProbeRole) {
      await ensureRlsProbeRole(prisma);
    }

    tenantA = randomUUID();
    tenantB = randomUUID();

    for (const tenantId of [tenantA, tenantB]) {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
        await tx.organization.create({
          data: { id: tenantId, name: `RLS Org ${tenantId.slice(0, 8)}` },
        });
      });
    }

    const employee = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantA}, true)`;
      return tx.employee.create({
        data: {
          tenantId: tenantA,
          email: `a_${randomUUID()}@example.com`,
          firstName: "Tenant",
          lastName: "A",
        },
      });
    });
    employeeAId = employee.id;
  });

  afterAll(async () => {
    if (prisma && tenantA && tenantB) {
      for (const tenantId of [tenantA, tenantB]) {
        await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
          await tx.employee.deleteMany({ where: { tenantId } });
          await tx.organization.deleteMany({ where: { id: tenantId } });
        });
      }
    }
    await prisma?.$disconnect();
    await pool?.end();
  });

  it("lets tenant A read its own employee by primary key", async () => {
    const ids = await employeeIdsVisibleToTenant(prisma, tenantA, employeeAId, useProbeRole);
    expect(ids).toEqual([employeeAId]);
  });

  it("returns no row when tenant B reads tenant A's employee by primary key", async () => {
    const ids = await employeeIdsVisibleToTenant(prisma, tenantB, employeeAId, useProbeRole);
    expect(ids).toEqual([]);
  });
});

async function ensureRlsProbeRole(prisma: PrismaClient): Promise<void> {
  const existing = await prisma.$queryRaw<Array<{ ok: boolean }>>`
    SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ${RLS_PROBE_ROLE}) AS ok
  `;
  if (!existing[0]?.ok) {
    await prisma.$executeRawUnsafe(
      `CREATE ROLE ${RLS_PROBE_ROLE} NOLOGIN NOSUPERUSER NOBYPASSRLS`,
    );
  }
  await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO ${RLS_PROBE_ROLE}`);
  await prisma.$executeRawUnsafe(`GRANT SELECT ON TABLE employees TO ${RLS_PROBE_ROLE}`);
}

/**
 * Primary-key lookup only. A `tenant_id` filter in the query would hide a
 * missing RLS policy. The session tenant comes from withAuthorizedTransaction.
 */
async function employeeIdsVisibleToTenant(
  prisma: PrismaClient,
  tenantId: string,
  employeeId: string,
  useProbeRole: boolean,
): Promise<string[]> {
  return withAuthorizedTransaction(
    prisma,
    authFor(tenantId),
    { permission: "employees:read" },
    async (tx) => {
      if (useProbeRole) {
        await tx.$executeRawUnsafe(`SET LOCAL ROLE ${RLS_PROBE_ROLE}`);
      }
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM employees WHERE id = ${employeeId}
      `;
      return rows.map((row) => row.id);
    },
  );
}
