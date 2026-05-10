#!/usr/bin/env npx tsx
/**
 * One-shot local demo: migrations → predictive HR seed → global L10n bootstrap → US/JP holiday import.
 *
 *   npm run demo:bootstrap
 *   npm run demo:bootstrap -- --skip-migrate --skip-predictive --skip-holiday --year=2025
 */
import "dotenv/config";
import { execSync } from "node:child_process";

import { syncNagerCalendarYear } from "@/lib/holidays/nager-sync";
import { getDemoTenantId } from "@/lib/l10n/demo-tenant";
import { bootstrapGlobalL10nDemo } from "@/lib/l10n/seed-demo";
import { withTenantRls } from "@/lib/l10n/prisma-tenant";
import { prisma } from "@/lib/prisma";

function parseArgs(): {
  skipMigrate: boolean;
  skipPredictive: boolean;
  skipHoliday: boolean;
  year: number;
} {
  const argv = process.argv.slice(2);
  const yearArg = argv.find((a) => a.startsWith("--year="));
  const fromFlag = yearArg ? Number(yearArg.slice("--year=".length)) : NaN;
  const fromEnv = Number(process.env.HOLIDAY_SYNC_YEAR);
  const year =
    Number.isFinite(fromFlag) && fromFlag > 0
      ? fromFlag
      : Number.isFinite(fromEnv) && fromEnv > 0
        ? fromEnv
        : 2026;

  return {
    skipMigrate: argv.includes("--skip-migrate"),
    skipPredictive: argv.includes("--skip-predictive"),
    skipHoliday: argv.includes("--skip-holiday"),
    year,
  };
}

async function main() {
  const opts = parseArgs();
  const tenantLabel = getDemoTenantId();

  if (!opts.skipMigrate) {
    console.info("[demo:bootstrap] prisma migrate deploy…");
    execSync("npm run db:migrate:deploy", {
      stdio: "inherit",
      env: process.env,
    });
  }

  if (!opts.skipPredictive) {
    console.info("[demo:bootstrap] predictive HR seed…");
    execSync("npm run db:seed:predictive", {
      stdio: "inherit",
      env: process.env,
    });
  }

  console.info("[demo:bootstrap] global L10n demo data…");
  const l10n = await bootstrapGlobalL10nDemo();

  if (!opts.skipHoliday) {
    console.info(
      `[demo:bootstrap] Nager public holidays ${opts.year} (US + JP)…`,
    );
    try {
      await withTenantRls(
        prisma,
        l10n.tenantId,
        "demo-bootstrap-holiday-us",
        async (tx) =>
          syncNagerCalendarYear(tx, l10n.calendarUsId, opts.year),
      );
      await withTenantRls(
        prisma,
        l10n.tenantId,
        "demo-bootstrap-holiday-jp",
        async (tx) =>
          syncNagerCalendarYear(tx, l10n.calendarJpId, opts.year),
      );
    } catch (e) {
      console.warn(
        "[demo:bootstrap] holiday sync failed (offline or API error?) — continue without it:",
        e,
      );
    }
  }

  await prisma.$disconnect();

  console.info(`
[demo:bootstrap] Done — tenant: ${tenantLabel}

Add to .env for analytics pages (local dev only):
  DEMO_TENANT_ID=${tenantLabel}
  ANALYTICS_DEMO_MODE=1

Then run: npm run dev
  · http://localhost:3000/demo/capabilities  (Phase 3 seeded snapshot — set ANALYTICS_DEMO_MODE=1)
  · http://localhost:3000/analytics/churn
  · http://localhost:3000/analytics/skills
  · http://localhost:3000/analytics/benchmarks
  · http://localhost:3000/global-l10n/profile
  · http://localhost:3000/employee/paystub

Issue a dev JWT: node scripts/issue-dev-jwt.mjs
Optional workers: npm run db:up:arch && npm run outbox:kafka / npm run worker:integrations
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
