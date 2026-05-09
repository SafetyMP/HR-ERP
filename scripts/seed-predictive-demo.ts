/**
 * Seeds a deterministic predictive-HR demo slice (skills, churn scores, benchmarks).
 * Run against a migrated local DB with RLS: uses set_config per transaction.
 *
 *   npm run db:seed:predictive
 */
import "dotenv/config";

import { Prisma } from "@/app/generated/prisma/client";
import { getDemoTenantId } from "@/lib/l10n/demo-tenant";
import { prisma } from "@/lib/prisma";

/** Same tenant as `/global-l10n/*` when `DEMO_TENANT_ID` is unset (see `lib/l10n/demo-tenant.ts`). */
const DEMO_ORG_ID = getDemoTenantId();

/** Stable UUID for Feature 001 QA / dev JWT (`DEV_SUBJECT_EMPLOYEE_ID`). */
const DEMO_EMPLOYEE_JORDAN_ID =
  process.env.DEMO_PAYSTUB_EMPLOYEE_ID?.trim() ??
  "b0000001-0001-4000-8000-000000000011";

function embed(skillSeed: string, dim = 8): number[] {
  const out = new Array(dim).fill(0);
  let h = 0;
  for (let i = 0; i < skillSeed.length; i++) {
    h = (h * 31 + skillSeed.charCodeAt(i)) >>> 0;
  }
  for (let i = 0; i < dim; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    out[i] = (h % 1000) / 1000 - 0.5;
  }
  const norm = Math.sqrt(out.reduce((s, x) => s + x * x, 0)) || 1;
  return out.map((x) => x / norm);
}

async function main() {
  let icRoleIdForDemo = "";

  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT set_config('app.tenant_id', ${DEMO_ORG_ID}, true)`,
      );
      await tx.$executeRaw(
        Prisma.sql`SELECT set_config('app.subject_id', ${"seed-job"}, true)`,
      );

      await tx.organization.upsert({
        where: { id: DEMO_ORG_ID },
        create: {
          id: DEMO_ORG_ID,
          name: "Predictive HR Demo Org",
          jurisdictionCountry: "DE",
          reportingCurrency: "EUR",
        },
        update: { name: "Predictive HR Demo Org" },
      });

      const dept = await tx.department.create({
        data: {
          tenantId: DEMO_ORG_ID,
          name: "Engineering",
          code: "ENG",
        },
      });

      const roleIc = await tx.jobRole.create({
        data: {
          tenantId: DEMO_ORG_ID,
          title: "Software Engineer",
          level: "IC3",
          departmentId: dept.id,
          canonicalTitle: "Senior Rust Engineer",
        },
      });
      icRoleIdForDemo = roleIc.id;

      const roleLead = await tx.jobRole.create({
        data: {
          tenantId: DEMO_ORG_ID,
          title: "Engineering Lead",
          level: "M1",
          departmentId: dept.id,
          canonicalTitle: "Engineering Manager — Platform",
        },
      });

      const skillRust = await tx.skill.create({
        data: {
          tenantId: DEMO_ORG_ID,
          name: "Rust",
          slug: "rust",
        },
      });
      const skillPg = await tx.skill.create({
        data: {
          tenantId: DEMO_ORG_ID,
          name: "PostgreSQL",
          slug: "postgresql",
        },
      });
      const skillPeople = await tx.skill.create({
        data: {
          tenantId: DEMO_ORG_ID,
          name: "People Leadership",
          slug: "people-leadership",
        },
      });

      await tx.roleSkillTarget.createMany({
        data: [
          { jobRoleId: roleIc.id, skillId: skillRust.id, importance: 1.5 },
          { jobRoleId: roleIc.id, skillId: skillPg.id, importance: 1 },
          { jobRoleId: roleLead.id, skillId: skillPeople.id, importance: 2 },
          { jobRoleId: roleLead.id, skillId: skillRust.id, importance: 0.8 },
        ],
      });

      const mgr = await tx.employee.create({
        data: {
          tenantId: DEMO_ORG_ID,
          email: "manager@predictive-hr.demo",
          firstName: "Alex",
          lastName: "Rivera",
          jobRoleId: roleLead.id,
          departmentId: dept.id,
          hireDate: new Date("2019-01-15"),
          anonymizedPseudonym: "anon_mgr_001",
        },
      });

      const e1 = await tx.employee.create({
        data: {
          id: DEMO_EMPLOYEE_JORDAN_ID,
          tenantId: DEMO_ORG_ID,
          email: "high-performer@predictive-hr.demo",
          firstName: "Jordan",
          lastName: "Chen",
          managerId: mgr.id,
          jobRoleId: roleIc.id,
          departmentId: dept.id,
          hireDate: new Date("2021-06-01"),
          anonymizedPseudonym: "anon_e1_002",
        },
      });

      await tx.employee.update({
        where: { id: e1.id },
        data: {
          preferredName: "Jordy",
          personalEmail: "jordan.chen.personal@example.demo",
          phone: "+49 30 12345678",
          mailingAddressLine1: "Musterstraße 12",
          mailingAddressLine2: "Building A",
          mailingCity: "Berlin",
          mailingRegion: "BE",
          mailingPostalCode: "10115",
          mailingCountry: "DE",
          emergencyContactName: "Sam Chen",
          emergencyContactPhone: "+49 170 9988776",
          emergencyContactRelationship: "Sibling",
        },
      });

      const e2 = await tx.employee.create({
        data: {
          tenantId: DEMO_ORG_ID,
          email: "stable@predictive-hr.demo",
          firstName: "Sam",
          lastName: "Taylor",
          managerId: mgr.id,
          jobRoleId: roleIc.id,
          departmentId: dept.id,
          hireDate: new Date("2020-03-10"),
          anonymizedPseudonym: "anon_e2_003",
        },
      });

      const v1 = embed("rust");
      const v2 = embed("postgresql");
      const v3 = embed("people-leadership");

      const skillsData = [
        {
          employeeId: e1.id,
          skillId: skillRust.id,
          proficiency: 5,
          embedding: v1,
        },
        {
          employeeId: e1.id,
          skillId: skillPg.id,
          proficiency: 4,
          embedding: v2,
        },
        {
          employeeId: e2.id,
          skillId: skillRust.id,
          proficiency: 3,
          embedding: embed("rust-alt"),
        },
        {
          employeeId: mgr.id,
          skillId: skillPeople.id,
          proficiency: 5,
          embedding: v3,
        },
        {
          employeeId: mgr.id,
          skillId: skillRust.id,
          proficiency: 4,
          embedding: embed("rust-mgr"),
        },
      ];
      for (const row of skillsData) {
        await tx.employeeSkill.create({ data: row });
      }

      await tx.compensationRecord.createMany({
        data: [
          {
            employeeId: e1.id,
            baseAmount: 118_000,
            currency: "EUR",
            effectiveFrom: new Date("2025-01-01"),
            bandPosition: 0.35,
            internalBandCode: "IC3-EU",
          },
          {
            employeeId: e2.id,
            baseAmount: 121_000,
            currency: "EUR",
            effectiveFrom: new Date("2025-01-01"),
            bandPosition: 0.72,
            internalBandCode: "IC3-EU",
          },
        ],
      });

      await tx.ptoBalance.createMany({
        data: [
          {
            employeeId: e1.id,
            balanceHours: 40,
            asOfDate: new Date(),
          },
          {
            employeeId: e2.id,
            balanceHours: 120,
            asOfDate: new Date(),
          },
        ],
      });

      await tx.ptoRequest.createMany({
        data: [
          { tenantId: DEMO_ORG_ID, employeeId: e1.id, requestDate: new Date("2026-05-02") },
          { tenantId: DEMO_ORG_ID, employeeId: e1.id, requestDate: new Date("2026-04-18") },
          { tenantId: DEMO_ORG_ID, employeeId: e1.id, requestDate: new Date("2026-03-10") },
        ],
      });

      await tx.performanceReview.createMany({
        data: [
          {
            employeeId: e1.id,
            periodStart: new Date("2025-01-01"),
            periodEnd: new Date("2025-12-31"),
            overallRating: 4.7,
            sentimentScore: 0.42,
          },
          {
            employeeId: e2.id,
            periodStart: new Date("2025-01-01"),
            periodEnd: new Date("2025-12-31"),
            overallRating: 3.9,
            sentimentScore: 0.05,
          },
        ],
      });

      const snapFeatures = {
        tenure_months: 42,
        pto_hours_remaining: 40,
        pto_requests_90d: 5,
        comp_band_position: 0.35,
        review_sentiment: 0.42,
        market_comp_ratio: 0.88,
      };

      await tx.analyticsFeatureSnapshot.create({
        data: {
          tenantId: DEMO_ORG_ID,
          employeeId: e1.id,
          snapshotDate: new Date(),
          features: snapFeatures,
          etlVersion: "etl_v1",
        },
      });

      await tx.churnScore.createMany({
        data: [
          {
            tenantId: DEMO_ORG_ID,
            employeeId: e1.id,
            score: 0.62,
            modelVersion: "churn_v1_logreg",
            drivers: {
              top: [
                { feature: "market_comp_ratio", delta: -0.12 },
                { feature: "pto_requests_90d", delta: 0.08 },
                { feature: "review_sentiment", delta: 0.05 },
              ],
            },
          },
          {
            tenantId: DEMO_ORG_ID,
            employeeId: e2.id,
            score: 0.18,
            modelVersion: "churn_v1_logreg",
            drivers: {
              top: [{ feature: "comp_band_position", delta: 0.02 }],
            },
          },
        ],
      });

      await tx.marketBenchmark.create({
        data: {
          tenantId: DEMO_ORG_ID,
          jobRoleId: roleIc.id,
          geoCode: "DE-BE",
          currency: "EUR",
          provider: "mock_provider",
          p50Annual: 125_000,
          p75Annual: 142_000,
          p90Annual: 158_000,
          sampleSize: 212,
          effectiveDate: new Date(),
          rawPayload: {
            title: "Senior Rust Engineer in Berlin",
            source: "demo",
          },
        },
      });

      await tx.benchmarkAlert.create({
        data: {
          tenantId: DEMO_ORG_ID,
          jobRoleId: roleIc.id,
          severity: "WARN",
          message:
            "Median cash comp for IC3 Rust (Berlin) is ~8% below mock market p50; review equity or base bump budget.",
        },
      });

      await tx.jobTitleMap.create({
        data: {
          tenantId: DEMO_ORG_ID,
          internalTitleKey: "software engineer|ic3",
          geoCode: "DE-BE",
          normalizedTitle: "Senior Rust Engineer — Berlin",
          externalOccupationCode: "SOC-DEMO-RUST-BERLIN",
          jobRoleId: roleIc.id,
        },
      });

      await tx.modelRegistry.create({
        data: {
          modelType: "churn_v1",
          version: "logreg-2026-01",
          artifactUri: "file://services/ml-serving/artifacts/churn_v1.joblib",
          isProduction: true,
          metrics: { auc: 0.71, precision_at_10: 0.45 },
        },
      });

      const payrollPeriod = await tx.payrollPeriod.create({
        data: {
          tenantId: DEMO_ORG_ID,
          startDate: new Date("2026-04-01"),
          endDate: new Date("2026-04-15"),
          label: "2026-04-A",
        },
      });

      await tx.paymentInstruction.create({
        data: {
          tenantId: DEMO_ORG_ID,
          employeeId: e1.id,
          payrollPeriodId: payrollPeriod.id,
          memo: "Demo employee earnings statement (Feature 001)",
          lines: {
            create: [
              {
                lineType: "SALARY",
                sortOrder: 10,
                amountMinor: 452_300,
                currencyCode: "EUR",
              },
              {
                lineType: "PRE_TAX_DEDUCTION",
                sortOrder: 20,
                amountMinor: 45_000,
                currencyCode: "EUR",
              },
              {
                lineType: "TAX_WITHHOLDING",
                sortOrder: 30,
                amountMinor: 120_000,
                currencyCode: "EUR",
              },
            ],
          },
        },
      });

      const payrollPeriodPrior = await tx.payrollPeriod.create({
        data: {
          tenantId: DEMO_ORG_ID,
          startDate: new Date("2026-03-16"),
          endDate: new Date("2026-03-31"),
          label: "2026-03-B",
        },
      });

      await tx.paymentInstruction.create({
        data: {
          tenantId: DEMO_ORG_ID,
          employeeId: e1.id,
          payrollPeriodId: payrollPeriodPrior.id,
          memo: "Prior-period demo pay history row",
          lines: {
            create: [
              {
                lineType: "SALARY",
                sortOrder: 10,
                amountMinor: 440_000,
                currencyCode: "EUR",
              },
              {
                lineType: "TAX_WITHHOLDING",
                sortOrder: 30,
                amountMinor: 115_000,
                currencyCode: "EUR",
              },
            ],
          },
        },
      });

      await tx.timeOffRequest.createMany({
        data: [
          {
            tenantId: DEMO_ORG_ID,
            employeeId: e1.id,
            startDate: new Date("2026-06-01"),
            endDate: new Date("2026-06-03"),
            status: "PENDING",
            note: "Demo pending submission",
          },
          {
            tenantId: DEMO_ORG_ID,
            employeeId: e1.id,
            startDate: new Date("2026-04-10"),
            endDate: new Date("2026-04-11"),
            status: "APPROVED",
          },
        ],
      });

      await tx.onboardingTask.createMany({
        data: [
          {
            employeeId: e1.id,
            title: "Complete profile and emergency contacts",
            status: "DONE",
            dueAt: new Date("2026-05-12"),
          },
          {
            employeeId: e1.id,
            title: "Sign employee handbook acknowledgement",
            status: "IN_PROGRESS",
            dueAt: new Date("2026-05-18"),
          },
          {
            employeeId: e1.id,
            title: "IT equipment acceptance",
            status: "PENDING",
            dueAt: new Date("2026-05-22"),
          },
        ],
      });

      await tx.hrCaseRequest.create({
        data: {
          tenantId: DEMO_ORG_ID,
          employeeId: e1.id,
          category: "PAYROLL",
          body: "Demo seeded payroll inquiry — safe to delete after QA.",
          status: "OPEN",
        },
      });

      await tx.benefitEnrollment.createMany({
        data: [
          {
            tenantId: DEMO_ORG_ID,
            employeeId: e1.id,
            category: "MEDICAL",
            planLabel: "PPO Gold — In-network preferred",
            carrierName: "Demo Health Collective",
            effectiveFrom: new Date("2026-01-01"),
            dependentCount: 2,
          },
          {
            tenantId: DEMO_ORG_ID,
            employeeId: e1.id,
            category: "DENTAL",
            planLabel: "Dental Essential Plus",
            carrierName: "Demo Dental Network",
            effectiveFrom: new Date("2026-01-01"),
          },
          {
            tenantId: DEMO_ORG_ID,
            employeeId: e1.id,
            category: "VISION",
            planLabel: "Vision Essentials",
            carrierName: "Demo Vision Partners",
            effectiveFrom: new Date("2026-01-01"),
          },
          {
            tenantId: DEMO_ORG_ID,
            employeeId: e1.id,
            category: "INCOME_PROTECTION",
            planLabel: "Long-term disability — 60% salary replacement",
            carrierName: "Demo Income Shield",
            effectiveFrom: new Date("2026-01-01"),
          },
          {
            tenantId: DEMO_ORG_ID,
            employeeId: e1.id,
            category: "RETIREMENT",
            planLabel: "401(k) — Traditional & Roth",
            carrierName: "Demo Retirement Services",
            effectiveFrom: new Date("2026-01-01"),
            retirementDeferralBasisPoints: 600,
          },
        ],
      });
    },
    { timeout: 60_000 },
  );

  console.info(
    `Predictive HR demo data ready. Add to .env (dev): DEMO_TENANT_ID=${DEMO_ORG_ID} and ANALYTICS_DEMO_MODE=1 for /analytics/* pages.`,
  );
  console.info(
    `Skills matcher: DEMO_TARGET_ROLE_ID=${icRoleIdForDemo}  ·  Paystub employee id: ${DEMO_EMPLOYEE_JORDAN_ID}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
