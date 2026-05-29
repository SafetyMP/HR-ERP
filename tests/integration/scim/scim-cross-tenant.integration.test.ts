import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/app/generated/prisma/client";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getScimUserById } from "@/lib/scim/users-service";
import { createIntegrationPrisma } from "@/tests/helpers/integration-prisma";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("SCIM cross-tenant isolation (integration)", () => {
  let prisma: PrismaClient;
  let pool: Pool;
  let tenantA: string;
  let tenantB: string;
  let employeeBId: string;

  beforeAll(async () => {
    const created = createIntegrationPrisma();
    prisma = created.prisma;
    pool = created.pool;

    tenantA = randomUUID();
    tenantB = randomUUID();

    for (const tenantId of [tenantA, tenantB]) {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
        await tx.organization.create({
          data: { id: tenantId, name: `Org ${tenantId.slice(0, 8)}` },
        });
      });
    }

    const employee = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantB}, true)`;
      return tx.employee.create({
        data: {
          tenantId: tenantB,
          email: `b_${randomUUID()}@example.com`,
          firstName: "Tenant",
          lastName: "B",
        },
      });
    });
    employeeBId = employee.id;
  });

  afterAll(async () => {
    for (const tenantId of [tenantA, tenantB]) {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
        await tx.employee.deleteMany({ where: { tenantId } });
        await tx.organization.deleteMany({ where: { id: tenantId } });
      });
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it("returns null when tenant A binding requests tenant B employee id", async () => {
    const result = await getScimUserById(prisma, { tenantId: tenantA }, employeeBId);
    expect(result).toBeNull();
  });
});
