import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { parallelDuplicateBarrierSettled } from "@/lib/qa/parallel-same-instant";
import { createIntegrationPrisma } from "@/tests/helpers/integration-prisma";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("pto_requests DB uniqueness (integration)", () => {
  const { prisma, pool } = createIntegrationPrisma();

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  it("parallel inserts for same tenant + employee + calendar day → exactly one unique violation", async () => {
    const tenantId = randomUUID();

    const employeeId = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      await tx.organization.create({
        data: { id: tenantId, name: `QA Org ${tenantId.slice(0, 8)}` },
      });
      const emp = await tx.employee.create({
        data: {
          tenantId,
          email: `emp_${randomUUID()}@example.com`,
        },
      });
      return emp.id;
    });

    const requestDate = new Date("2026-07-04T00:00:00.000Z");

    const results = await parallelDuplicateBarrierSettled(2, () =>
      prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
        return tx.ptoRequest.create({
          data: {
            tenantId,
            employeeId,
            requestDate,
            idempotencyKey: randomUUID(),
          },
        });
      }),
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const rows = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      return tx.ptoRequest.findMany({ where: { employeeId } });
    });
    expect(rows).toHaveLength(1);

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      await tx.employee.deleteMany({ where: { tenantId } });
      await tx.organization.deleteMany({ where: { id: tenantId } });
    });
  });
});
