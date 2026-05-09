/**
 * Seeds a deterministic predictive-HR demo slice (skills, churn scores, benchmarks).
 * Run against a migrated local DB with RLS: uses set_config per transaction.
 *
 *   npm run db:seed:predictive
 */
import "dotenv/config";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const DEMO_ORG_ID =
  process.env.DEMO_TENANT_ID?.trim() ??
  "a0000001-0001-4000-8000-000000000001";

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
    },
    { timeout: 60_000 },
  );

  console.info(
    `Predictive HR demo data ready. Set DEMO_TENANT_ID=${DEMO_ORG_ID} for analytics demo pages.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
