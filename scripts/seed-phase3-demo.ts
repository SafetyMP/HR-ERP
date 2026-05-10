/**
 * Idempotent Phase 3 demo slice (performance, compensation, positions,
 * engagement, LMS, workflows, webhooks, COBRA). Runs after the predictive HR
 * seed so existing Docker/Neon demos pick up new tables without full reset.
 */
import { Prisma } from "@/app/generated/prisma/client";
import { WorkflowStepsSchema } from "@/lib/workflow/engine";

export const DEMO_PHASE3_DEFAULT_IDS = {
  perfCycle: "b0000001-0001-4000-8000-000000000050",
  perfGoalJordan1: "b0000001-0001-4000-8000-000000000053",
  perfGoalJordan2: "b0000001-0001-4000-8000-000000000054",
  compCycle: "b0000001-0001-4000-8000-000000000051",
  engagementSurvey: "b0000001-0001-4000-8000-000000000052",
  engagementExtraA: "b0000001-0001-4000-8000-000000000041",
  engagementExtraB: "b0000001-0001-4000-8000-000000000042",
  engagementExtraC: "b0000001-0001-4000-8000-000000000043",
  learningCourse: "b0000001-0001-4000-8000-000000000055",
  webhookSubscription: "b0000001-0001-4000-8000-000000000056",
  cobraEvent: "b0000001-0001-4000-8000-000000000057",
} as const;

export type Phase3DemoIds = typeof DEMO_PHASE3_DEFAULT_IDS;

export interface SeedPhase3DemoContext {
  tenantId: string;
  jordanEmployeeId: string;
  managerEmployeeId: string;
  /** Override primary keys for isolated integration tests */
  ids?: Partial<Phase3DemoIds>;
}

const POSITION_CODES = {
  lead: "DEMO-MGR-PLATFORM",
  ic: "DEMO-IC-SENIOR",
} as const;

const WORKFLOW_CODE = "demo-time-off-approval";

const LEARNING_COURSE_CODE = "DEMO-COURSE-SEC-AWARE";

/** Synthetic subscribers so OPEN eNPS survey can meet ≥5 responses for anonymity demos */
const ENGAGEMENT_EXTRA_EMAILS = [
  "engagement-extra-a@predictive-hr.demo",
  "engagement-extra-b@predictive-hr.demo",
  "engagement-extra-c@predictive-hr.demo",
] as const;

function demoWebhookSecret(): string {
  const fromEnv = process.env.DEMO_WEBHOOK_PUBLISHER_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  return "demo-webhook-publisher-secret-change-me-32chars-min";
}

export function buildPhase3DemoWorkflowSteps(): ReturnType<
  typeof WorkflowStepsSchema.parse
> {
  return WorkflowStepsSchema.parse([
    { name: "Manager", approverRoles: ["manager"] },
    { name: "HR Admin", approverRoles: ["hr_admin"], slaHours: 48 },
  ]);
}

function phase3WorkflowStepsJson(): Prisma.InputJsonValue {
  return buildPhase3DemoWorkflowSteps() as unknown as Prisma.InputJsonValue;
}

/**
 * Insert/update Phase 3 demo rows. Caller must run inside a transaction with
 * RLS `set_config` already applied (see predictive HR seed).
 */
export async function seedPhase3Demo(
  tx: Prisma.TransactionClient,
  ctx: SeedPhase3DemoContext,
): Promise<void> {
  const ids = { ...DEMO_PHASE3_DEFAULT_IDS, ...ctx.ids };
  const { tenantId, jordanEmployeeId, managerEmployeeId } = ctx;

  const jordan = await tx.employee.findFirst({
    where: { id: jordanEmployeeId, tenantId },
    select: {
      id: true,
      departmentId: true,
      jobRoleId: true,
    },
  });
  if (!jordan?.departmentId || !jordan.jobRoleId) {
    console.warn(
      "[seed:phase3] skipped — Jordan demo employee missing or has no department/job role",
    );
    return;
  }

  const alex = await tx.employee.findFirst({
    where: { id: managerEmployeeId, tenantId },
    select: { id: true, jobRoleId: true },
  });

  const sam = await tx.employee.findFirst({
    where: { tenantId, email: "stable@predictive-hr.demo" },
    select: { id: true },
  });

  await tx.employee.upsert({
    where: { id: ids.engagementExtraA },
    create: {
      id: ids.engagementExtraA,
      tenantId,
      email: ENGAGEMENT_EXTRA_EMAILS[0],
      firstName: "Riley",
      lastName: "Ng",
      departmentId: jordan.departmentId,
      jobRoleId: jordan.jobRoleId,
      hireDate: new Date("2023-02-01"),
    },
    update: {
      departmentId: jordan.departmentId,
      jobRoleId: jordan.jobRoleId,
    },
  });

  await tx.employee.upsert({
    where: { id: ids.engagementExtraB },
    create: {
      id: ids.engagementExtraB,
      tenantId,
      email: ENGAGEMENT_EXTRA_EMAILS[1],
      firstName: "Casey",
      lastName: "Park",
      departmentId: jordan.departmentId,
      jobRoleId: jordan.jobRoleId,
      hireDate: new Date("2023-06-15"),
    },
    update: {
      departmentId: jordan.departmentId,
      jobRoleId: jordan.jobRoleId,
    },
  });

  await tx.employee.upsert({
    where: { id: ids.engagementExtraC },
    create: {
      id: ids.engagementExtraC,
      tenantId,
      email: ENGAGEMENT_EXTRA_EMAILS[2],
      firstName: "Morgan",
      lastName: "Lee",
      departmentId: jordan.departmentId,
      jobRoleId: jordan.jobRoleId,
      hireDate: new Date("2024-01-10"),
    },
    update: {
      departmentId: jordan.departmentId,
      jobRoleId: jordan.jobRoleId,
    },
  });

  await tx.performanceCycle.upsert({
    where: { id: ids.perfCycle },
    create: {
      id: ids.perfCycle,
      tenantId,
      name: "FY26 H1 Demo Performance Cycle",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-30"),
      status: "OPEN",
      ratingScaleMax: 5,
    },
    update: {
      name: "FY26 H1 Demo Performance Cycle",
      status: "OPEN",
    },
  });

  await tx.performanceGoal.upsert({
    where: { id: ids.perfGoalJordan1 },
    create: {
      id: ids.perfGoalJordan1,
      tenantId,
      cycleId: ids.perfCycle,
      employeeId: jordanEmployeeId,
      title: "Ship payroll observability slice",
      description: "Demo goal — deterministic seed",
      weightBp: 5000,
      status: "ACTIVE",
      percentCompleteBp: 2500,
      dueDate: new Date("2026-05-31"),
    },
    update: {
      status: "ACTIVE",
      weightBp: 5000,
    },
  });

  await tx.performanceGoal.upsert({
    where: { id: ids.perfGoalJordan2 },
    create: {
      id: ids.perfGoalJordan2,
      tenantId,
      cycleId: ids.perfCycle,
      employeeId: jordanEmployeeId,
      title: "Mentor onboarding cohort Q2",
      weightBp: 3000,
      status: "ACTIVE",
      percentCompleteBp: 1000,
    },
    update: {
      status: "ACTIVE",
    },
  });

  await tx.performanceReviewV2.upsert({
    where: {
      tenantId_cycleId_employeeId: {
        tenantId,
        cycleId: ids.perfCycle,
        employeeId: jordanEmployeeId,
      },
    },
    create: {
      tenantId,
      cycleId: ids.perfCycle,
      employeeId: jordanEmployeeId,
      managerSubjectId: managerEmployeeId,
      status: "MANAGER_SUBMITTED",
      selfRating: 4,
      managerRating: 4,
      managerNote: "Demo review — seed data",
    },
    update: {
      status: "MANAGER_SUBMITTED",
      managerRating: 4,
    },
  });

  await tx.compensationCycle.upsert({
    where: { id: ids.compCycle },
    create: {
      id: ids.compCycle,
      tenantId,
      name: "FY26 Merit Demo Cycle",
      cycleType: "MERIT",
      effectiveDate: new Date("2026-07-01"),
      status: "OPEN",
      currencyCode: "EUR",
    },
    update: {
      status: "OPEN",
      currencyCode: "EUR",
    },
  });

  await tx.compensationRecommendation.upsert({
    where: {
      tenantId_cycleId_employeeId: {
        tenantId,
        cycleId: ids.compCycle,
        employeeId: jordanEmployeeId,
      },
    },
    create: {
      tenantId,
      cycleId: ids.compCycle,
      employeeId: jordanEmployeeId,
      status: "DRAFT",
      baseIncreaseAmountMinor: BigInt(4_500_00),
      bonusAmountMinor: BigInt(2_000_00),
      justification: "Demo merit recommendation — minor units EUR cents",
    },
    update: {
      baseIncreaseAmountMinor: BigInt(4_500_00),
      justification: "Demo merit recommendation — minor units EUR cents",
    },
  });

  const parentPosition = await tx.position.upsert({
    where: {
      tenantId_code: { tenantId, code: POSITION_CODES.lead },
    },
    create: {
      tenantId,
      code: POSITION_CODES.lead,
      title: "Engineering Manager — Platform",
      jobRoleId: alex?.jobRoleId ?? jordan.jobRoleId,
      departmentId: jordan.departmentId,
      status: "ACTIVE",
      headcount: 1,
      effectiveFrom: new Date("2026-01-01"),
    },
    update: {
      title: "Engineering Manager — Platform",
      status: "ACTIVE",
      departmentId: jordan.departmentId,
    },
  });

  await tx.position.upsert({
    where: {
      tenantId_code: { tenantId, code: POSITION_CODES.ic },
    },
    create: {
      tenantId,
      code: POSITION_CODES.ic,
      title: "Senior Software Engineer",
      jobRoleId: jordan.jobRoleId,
      departmentId: jordan.departmentId,
      parentPositionId: parentPosition.id,
      status: "ACTIVE",
      headcount: 1,
      effectiveFrom: new Date("2026-01-01"),
    },
    update: {
      parentPositionId: parentPosition.id,
      status: "ACTIVE",
    },
  });

  await tx.engagementSurvey.upsert({
    where: { id: ids.engagementSurvey },
    create: {
      id: ids.engagementSurvey,
      tenantId,
      kind: "ENPS",
      title: "FY26 Q1 eNPS — Demo",
      description: "Demo engagement pulse — ≥5 responses for anonymity demos",
      anonymize: true,
      status: "OPEN",
      startedAt: new Date("2026-04-01"),
    },
    update: {
      status: "OPEN",
      anonymize: true,
    },
  });

  const responseSubjects: { employeeId: string; score: number }[] = [
    { employeeId: jordanEmployeeId, score: 9 },
    { employeeId: managerEmployeeId, score: 8 },
    ...(sam ? [{ employeeId: sam.id, score: 7 }] : []),
    { employeeId: ids.engagementExtraA, score: 8 },
    { employeeId: ids.engagementExtraB, score: 9 },
    { employeeId: ids.engagementExtraC, score: 8 },
  ];

  for (const row of responseSubjects) {
    await tx.engagementResponse.upsert({
      where: {
        tenantId_surveyId_employeeId: {
          tenantId,
          surveyId: ids.engagementSurvey,
          employeeId: row.employeeId,
        },
      },
      create: {
        tenantId,
        surveyId: ids.engagementSurvey,
        employeeId: row.employeeId,
        score: row.score,
        comment: row.score >= 9 ? "Demo promoter comment" : null,
      },
      update: {
        score: row.score,
      },
    });
  }

  await tx.learningCourse.upsert({
    where: {
      tenantId_code: { tenantId, code: LEARNING_COURSE_CODE },
    },
    create: {
      id: ids.learningCourse,
      tenantId,
      code: LEARNING_COURSE_CODE,
      title: "Security awareness essentials",
      description: "Demo LMS course — seeded",
      status: "PUBLISHED",
      mandatoryDueDays: 30,
      estimatedDuration: "PT45M",
    },
    update: {
      title: "Security awareness essentials",
      status: "PUBLISHED",
    },
  });

  await tx.learningEnrollment.upsert({
    where: {
      tenantId_courseId_employeeId: {
        tenantId,
        courseId: ids.learningCourse,
        employeeId: jordanEmployeeId,
      },
    },
    create: {
      tenantId,
      courseId: ids.learningCourse,
      employeeId: jordanEmployeeId,
      status: "IN_PROGRESS",
      startedAt: new Date("2026-05-01"),
      dueAt: new Date("2026-06-01"),
    },
    update: {
      status: "IN_PROGRESS",
    },
  });

  await tx.workflowDefinition.upsert({
    where: {
      tenantId_code: { tenantId, code: WORKFLOW_CODE },
    },
    create: {
      tenantId,
      kind: "TIME_OFF_APPROVAL",
      code: WORKFLOW_CODE,
      name: "Demo time-off approval",
      description: "Two-step blueprint for QA / demo tenants",
      steps: phase3WorkflowStepsJson(),
      isActive: true,
    },
    update: {
      steps: phase3WorkflowStepsJson(),
      isActive: true,
    },
  });

  await tx.webhookSubscription.upsert({
    where: { id: ids.webhookSubscription },
    create: {
      id: ids.webhookSubscription,
      tenantId,
      label: "Demo outbound webhook",
      targetUrl: "https://example.com/hr-erp-demo-webhook",
      secret: demoWebhookSecret(),
      eventTypes: [
        "domain.core_hr.demo_placeholder",
        "integration.vendor.demo_event",
      ],
      isActive: true,
    },
    update: {
      label: "Demo outbound webhook",
      secret: demoWebhookSecret(),
      isActive: true,
    },
  });

  if (sam) {
    await tx.cobraEvent.upsert({
      where: { id: ids.cobraEvent },
      create: {
        id: ids.cobraEvent,
        tenantId,
        employeeId: sam.id,
        qualifyingEvent: "TERMINATION",
        qualifyingDate: new Date("2026-05-01"),
        electionDeadline: new Date("2026-06-30"),
        electionStatus: "NOTICE_SENT",
        noticeSentAt: new Date("2026-05-02"),
        payload: {
          demo: true,
          note: "COBRA qualifying event — synthetic terminated employee (Sam)",
        },
      },
      update: {
        electionStatus: "NOTICE_SENT",
      },
    });
  }
}
