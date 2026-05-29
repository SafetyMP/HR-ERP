import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/app/generated/prisma/client";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createScimUser,
  getScimUserById,
  listScimUsers,
} from "@/lib/scim/users-service";
import { createIntegrationPrisma } from "@/tests/helpers/integration-prisma";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("SCIM provisioning under RLS (integration)", () => {
  let prisma: PrismaClient;
  let pool: Pool;
  let tenantId: string;

  beforeAll(() => {
    const created = createIntegrationPrisma();
    prisma = created.prisma;
    pool = created.pool;
  });

  afterAll(async () => {
    if (tenantId) {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
        await tx.employee.deleteMany({ where: { tenantId } });
        await tx.organization.deleteMany({ where: { id: tenantId } });
      });
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it("withScimTransaction can read and write employees for the bound tenant", async () => {
    tenantId = randomUUID();
    const binding = { tenantId };

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      await tx.organization.create({
        data: { id: tenantId, name: `SCIM Org ${tenantId.slice(0, 8)}` },
      });
    });

    const email = `scim_${randomUUID()}@example.com`;
    const created = await createScimUser(prisma, binding, {
      email,
      firstName: "Scim",
      lastName: "User",
      active: true,
    });

    const fetched = await getScimUserById(prisma, binding, created.id);
    expect(fetched?.email).toBe(email);

    const { total, employees } = await listScimUsers(prisma, binding, {
      startIndex: 1,
      count: 50,
      userNameFilter: null,
    });
    expect(total).toBeGreaterThanOrEqual(1);
    expect(employees.some((e) => e.id === created.id)).toBe(true);
  });

  it("listScimUsers returns empty when binding tenant has no employees", async () => {
    const emptyTenant = randomUUID();
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${emptyTenant}, true)`;
      await tx.organization.create({
        data: { id: emptyTenant, name: "Empty SCIM tenant" },
      });
    });

    const { total } = await listScimUsers(prisma, { tenantId: emptyTenant }, {
      startIndex: 1,
      count: 10,
      userNameFilter: null,
    });
    expect(total).toBe(0);

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${emptyTenant}, true)`;
      await tx.organization.deleteMany({ where: { id: emptyTenant } });
    });
  });
});
