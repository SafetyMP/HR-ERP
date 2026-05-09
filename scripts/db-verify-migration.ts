#!/usr/bin/env npx tsx
/**
 * Post-migrate integrity smoke for the Prisma app database (read-only).
 * Requires DATABASE_URL. Uses a dedicated pool — safe for CI after `prisma migrate deploy`.
 *
 *   npm run db:verify
 *
 * Extend with new predicates when schema domains grow; keep queries tenant-agnostic.
 * Production: run as a role with BYPASSRLS or superuser — see docs/architecture/database-migrations-and-state.md
 */
import "dotenv/config";

import { createIntegrationPrisma } from "@/tests/helpers/integration-prisma";

async function scalarCount(
  prisma: ReturnType<typeof createIntegrationPrisma>["prisma"],
  sql: string,
): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(sql);
  const raw = rows[0]?.c;
  return raw === undefined ? 0 : Number(raw);
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("db-verify-migration: DATABASE_URL is not set");
    process.exitCode = 2;
    return;
  }

  const { prisma, pool } = createIntegrationPrisma();

  const checks: Array<{ name: string; count: number }> = [];

  try {
    checks.push({
      name: "employees.tenant_id missing organizations row",
      count: await scalarCount(
        prisma,
        `SELECT COUNT(*)::bigint AS c FROM employees e
         WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = e.tenant_id)`,
      ),
    });

    checks.push({
      name: "employees.manager_id invalid or cross-tenant",
      count: await scalarCount(
        prisma,
        `SELECT COUNT(*)::bigint AS c FROM employees e
         WHERE e.manager_id IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM employees m
             WHERE m.id = e.manager_id AND m.tenant_id = e.tenant_id
           )`,
      ),
    });

    checks.push({
      name: "employees.department_id orphan or cross-tenant",
      count: await scalarCount(
        prisma,
        `SELECT COUNT(*)::bigint AS c FROM employees e
         WHERE e.department_id IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM departments d
             WHERE d.id = e.department_id AND d.tenant_id = e.tenant_id
           )`,
      ),
    });

    checks.push({
      name: "employees.job_role_id orphan or cross-tenant",
      count: await scalarCount(
        prisma,
        `SELECT COUNT(*)::bigint AS c FROM employees e
         WHERE e.job_role_id IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM job_roles j
             WHERE j.id = e.job_role_id AND j.tenant_id = e.tenant_id
           )`,
      ),
    });

    checks.push({
      name: "departments.tenant_id missing organizations row",
      count: await scalarCount(
        prisma,
        `SELECT COUNT(*)::bigint AS c FROM departments d
         WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = d.tenant_id)`,
      ),
    });

    checks.push({
      name: "job_roles.department_id orphan or cross-tenant",
      count: await scalarCount(
        prisma,
        `SELECT COUNT(*)::bigint AS c FROM job_roles j
         WHERE j.department_id IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM departments d
             WHERE d.id = j.department_id AND d.tenant_id = j.tenant_id
           )`,
      ),
    });

    checks.push({
      name: "pto_requests missing employee or tenant mismatch",
      count: await scalarCount(
        prisma,
        `SELECT COUNT(*)::bigint AS c FROM pto_requests p
         LEFT JOIN employees e ON e.id = p.employee_id
         WHERE e.id IS NULL OR e.tenant_id <> p.tenant_id`,
      ),
    });

    checks.push({
      name: "compensation_records missing employee",
      count: await scalarCount(
        prisma,
        `SELECT COUNT(*)::bigint AS c FROM compensation_records c
         WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = c.employee_id)`,
      ),
    });

    checks.push({
      name: "pto_balances missing employee",
      count: await scalarCount(
        prisma,
        `SELECT COUNT(*)::bigint AS c FROM pto_balances b
         WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = b.employee_id)`,
      ),
    });

    checks.push({
      name: "performance_reviews missing employee",
      count: await scalarCount(
        prisma,
        `SELECT COUNT(*)::bigint AS c FROM performance_reviews r
         WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = r.employee_id)`,
      ),
    });

    checks.push({
      name: "employment_events missing employee",
      count: await scalarCount(
        prisma,
        `SELECT COUNT(*)::bigint AS c FROM employment_events ev
         WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = ev.employee_id)`,
      ),
    });
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  const failures = checks.filter((c) => c.count > 0);
  for (const row of checks) {
    const ok = row.count === 0 ? "OK" : "FAIL";
    console.log(`[${ok}] ${row.name}: ${row.count}`);
  }

  if (failures.length > 0) {
    console.error(
      `\ndb-verify-migration: ${failures.length} check(s) failed — paste counts into FAILURE_SUMMARY.OBSERVED`,
    );
    process.exitCode = 1;
  } else {
    console.log("\ndb-verify-migration: all checks passed");
  }
}

void main();
