#!/usr/bin/env npx tsx
/**
 * Hydrate Postgres from QA EmployeeScenario JSON (e.g. tests/generated/*.json).
 * Respects RLS via set_config per tenant transaction — same pattern as seed-predictive-demo.
 *
 *   npm run db:load:fixtures -- --file=tests/generated/employees_seed_12345_n_5000.json --max=200
 *
 * Synthetic data only — see docs/QA.md
 */
import * as fs from "node:fs";
import * as path from "node:path";

import "dotenv/config";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { EmployeeScenario } from "@/tests/fixtures/employees/types";

function parseArgs(): { file: string; max: number; dryRun: boolean } {
  const argv = process.argv.slice(2);
  let file = "";
  let max = 200;
  let dryRun = false;
  for (const a of argv) {
    if (a.startsWith("--file=")) file = a.slice("--file=".length);
    if (a.startsWith("--max=")) max = Number(a.slice("--max=".length));
    if (a === "--dry-run") dryRun = true;
  }
  if (!file.trim()) {
    throw new Error("Missing --file=path/to/employees_batch.json");
  }
  if (!Number.isFinite(max) || max < 1) {
    throw new Error("Invalid --max (expect positive integer)");
  }
  return { file: path.resolve(file), max, dryRun };
}

function isScenario(x: unknown): x is EmployeeScenario {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.scenarioId === "string" &&
    typeof o.tenantId === "string" &&
    typeof o.email === "string" &&
    typeof o.firstName === "string" &&
    typeof o.lastName === "string"
  );
}

function loadScenarios(file: string): EmployeeScenario[] {
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error("Fixture JSON must be an array of EmployeeScenario objects");
  }
  const out: EmployeeScenario[] = [];
  for (const row of raw) {
    if (!isScenario(row)) {
      throw new Error("Invalid EmployeeScenario row (need scenarioId, tenantId, email, firstName, lastName)");
    }
    out.push(row);
  }
  return out;
}

function groupByTenant(scenarios: EmployeeScenario[]): Map<string, EmployeeScenario[]> {
  const m = new Map<string, EmployeeScenario[]>();
  for (const s of scenarios) {
    const list = m.get(s.tenantId) ?? [];
    list.push(s);
    m.set(s.tenantId, list);
  }
  return m;
}

async function main(): Promise<void> {
  const { file, max, dryRun } = parseArgs();
  const all = loadScenarios(file);
  const slice = all.slice(0, max);
  const byTenant = groupByTenant(slice);

  console.log(
    `db-load-employee-scenarios: file=${file} total_in_file=${all.length} loading=${slice.length} tenants=${byTenant.size} dry_run=${dryRun}`,
  );

  if (dryRun) {
    return;
  }

  for (const [tenantId, scenarios] of byTenant) {
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw(
          Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
        );
        await tx.$executeRaw(
          Prisma.sql`SELECT set_config('app.subject_id', ${"fixture-loader"}, true)`,
        );

        await tx.organization.upsert({
          where: { id: tenantId },
          create: {
            id: tenantId,
            name: `Fixture org (${tenantId})`,
            jurisdictionCountry: "US",
            reportingCurrency: "USD",
          },
          update: {},
        });

        for (const s of scenarios) {
          await tx.employee.upsert({
            where: {
              tenantId_email: { tenantId: s.tenantId, email: s.email },
            },
            create: {
              tenantId: s.tenantId,
              email: s.email,
              firstName: s.firstName,
              lastName: s.lastName,
            },
            update: {
              firstName: s.firstName,
              lastName: s.lastName,
            },
          });
        }
      },
      { timeout: 120_000 },
    );
  }

  console.log("db-load-employee-scenarios: done");
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
