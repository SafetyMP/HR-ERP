import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/app/generated/prisma/client";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma } from "@/app/generated/prisma/client";
import { seedPhase3Demo } from "../../../scripts/seed-phase3-demo";
import { createIntegrationPrisma } from "@/tests/helpers/integration-prisma";

const hasDb = Boolean(process.env.DATABASE_URL);

function randomIds() {
  return {
    perfCycle: randomUUID(),
    perfGoalJordan1: randomUUID(),
    perfGoalJordan2: randomUUID(),
    compCycle: randomUUID(),
    engagementSurvey: randomUUID(),
    engagementExtraA: randomUUID(),
    engagementExtraB: randomUUID(),
    engagementExtraC: randomUUID(),
    learningCourse: randomUUID(),
    webhookSubscription: randomUUID(),
    cobraEvent: randomUUID(),
  };
}

describe.skipIf(!hasDb)("seedPhase3Demo idempotency (integration)", () => {
  let prisma: PrismaClient;
  let pool: Pool;

  beforeAll(() => {
    const created = createIntegrationPrisma();
    prisma = created.prisma;
    pool = created.pool;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  it("runs twice without duplicate key errors and preserves row counts", async () => {
    const tenantId = randomUUID();
    const jordanId = randomUUID();
    const alexId = randomUUID();
    const samId = randomUUID();
    const ids = randomIds();

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
      );
      await tx.$executeRaw(
        Prisma.sql`SELECT set_config('app.subject_id', ${"vitest-phase3"}, true)`,
      );

      await tx.organization.create({
        data: { id: tenantId, name: `Phase3 QA ${tenantId.slice(0, 8)}` },
      });

      const dept = await tx.department.create({
        data: {
          tenantId,
          name: "QA Engineering",
          code: `QE-${tenantId.slice(0, 8)}`,
        },
      });

      const roleIc = await tx.jobRole.create({
        data: {
          tenantId,
          title: "QA IC",
          level: "IC2",
          departmentId: dept.id,
          canonicalTitle: "QA Engineer",
        },
      });

      const roleMgr = await tx.jobRole.create({
        data: {
          tenantId,
          title: "QA Manager",
          level: "M1",
          departmentId: dept.id,
          canonicalTitle: "QA Manager",
        },
      });

      await tx.employee.create({
        data: {
          id: alexId,
          tenantId,
          email: `mgr_${tenantId.slice(0, 8)}@phase3-qa.example`,
          firstName: "Alex",
          lastName: "QA",
          departmentId: dept.id,
          jobRoleId: roleMgr.id,
          hireDate: new Date("2020-01-01"),
        },
      });

      await tx.employee.create({
        data: {
          id: jordanId,
          tenantId,
          email: `ic_${tenantId.slice(0, 8)}@phase3-qa.example`,
          firstName: "Jordan",
          lastName: "QA",
          managerId: alexId,
          departmentId: dept.id,
          jobRoleId: roleIc.id,
          hireDate: new Date("2021-06-01"),
        },
      });

      await tx.employee.create({
        data: {
          id: samId,
          tenantId,
          email: "stable@predictive-hr.demo",
          firstName: "Sam",
          lastName: "QA",
          managerId: alexId,
          departmentId: dept.id,
          jobRoleId: roleIc.id,
          hireDate: new Date("2020-03-10"),
          status: "TERMINATED",
          terminationDate: new Date("2026-05-01"),
        },
      });
    });

    const runSeed = () =>
      prisma.$transaction(async (tx) => {
        await tx.$executeRaw(
          Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
        );
        await tx.$executeRaw(
          Prisma.sql`SELECT set_config('app.subject_id', ${"vitest-phase3"}, true)`,
        );
        await seedPhase3Demo(tx, {
          tenantId,
          jordanEmployeeId: jordanId,
          managerEmployeeId: alexId,
          ids,
        });
      });

    await runSeed();
    await runSeed();

    const counts = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
      );
      const goals = await tx.performanceGoal.count({ where: { tenantId } });
      const responses = await tx.engagementResponse.count({
        where: { tenantId },
      });
      const positions = await tx.position.count({ where: { tenantId } });
      return { goals, responses, positions };
    });

    expect(counts.goals).toBe(2);
    expect(counts.responses).toBeGreaterThanOrEqual(5);
    expect(counts.positions).toBe(2);

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
      );
      await tx.cobraEvent.deleteMany({ where: { tenantId } });
      await tx.webhookSubscription.deleteMany({ where: { tenantId } });
      await tx.workflowDefinition.deleteMany({ where: { tenantId } });
      await tx.learningEnrollment.deleteMany({ where: { tenantId } });
      await tx.learningCourse.deleteMany({ where: { tenantId } });
      await tx.engagementResponse.deleteMany({ where: { tenantId } });
      await tx.engagementSurvey.deleteMany({ where: { tenantId } });
      await tx.position.deleteMany({
        where: { tenantId, code: "DEMO-IC-SENIOR" },
      });
      await tx.position.deleteMany({
        where: { tenantId, code: "DEMO-MGR-PLATFORM" },
      });
      await tx.compensationRecommendation.deleteMany({ where: { tenantId } });
      await tx.compensationCycle.deleteMany({ where: { tenantId } });
      await tx.performanceReviewV2.deleteMany({ where: { tenantId } });
      await tx.performanceGoal.deleteMany({ where: { tenantId } });
      await tx.performanceCycle.deleteMany({ where: { tenantId } });
      await tx.employee.deleteMany({ where: { tenantId } });
      await tx.jobRole.deleteMany({ where: { tenantId } });
      await tx.department.deleteMany({ where: { tenantId } });
      await tx.organization.deleteMany({ where: { id: tenantId } });
    });
  });
});
