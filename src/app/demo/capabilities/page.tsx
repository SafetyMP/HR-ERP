import Link from "next/link";

import {
  demoHrAdminAuth,
  isAnalyticsDemoMode,
  requireDemoTenantId,
} from "@/lib/analytics/demo-auth";
import { listCompensationCycles } from "@/lib/compensation/cycles";
import { listPerformanceCycles } from "@/lib/performance/cycles";
import { listGoalsForEmployee } from "@/lib/performance/goals";
import { prisma } from "@/lib/prisma";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export const dynamic = "force-dynamic";

const codeBox =
  "rounded-md bg-muted px-1.5 py-0.5 text-[13px] font-mono text-foreground";

const linkClass =
  "font-semibold text-primary underline decoration-2 underline-offset-[5px] hover:brightness-125";

/** Stable demo IC — matches predictive HR seed defaults */
const DEMO_IC_EMPLOYEE_ID =
  process.env.DEMO_PAYSTUB_EMPLOYEE_ID?.trim() ??
  "b0000001-0001-4000-8000-000000000011";

async function loadSnapshot(tenantId: string) {
  const auth = demoHrAdminAuth(tenantId);

  const [
    performanceCycles,
    compensationCycles,
    goalsForJordan,
    positions,
    learningCourses,
    learningEnrollments,
    workflowDefinitions,
    engagementSurveys,
    webhookSubscriptions,
    cobraEvents,
    compensationRecommendations,
  ] = await Promise.all([
    listPerformanceCycles(auth, {}),
    listCompensationCycles(auth, {}),
    listGoalsForEmployee(auth, DEMO_IC_EMPLOYEE_ID),
    withAuthorizedTransaction(
      prisma,
      auth,
      { permission: "position:read", resourceClassification: "internal" },
      async (tx) =>
        tx.position.findMany({
          where: { tenantId },
          orderBy: { code: "asc" },
          take: 50,
        }),
    ),
    withAuthorizedTransaction(
      prisma,
      auth,
      { permission: "learning:catalog_read", resourceClassification: "internal" },
      async (tx) =>
        tx.learningCourse.findMany({
          where: { tenantId },
          orderBy: { title: "asc" },
          take: 50,
        }),
    ),
    withAuthorizedTransaction(
      prisma,
      auth,
      {
        permission: "learning:enrollment_assign",
        resourceClassification: "internal",
      },
      async (tx) =>
        tx.learningEnrollment.findMany({
          where: { tenantId },
          orderBy: { assignedAt: "desc" },
          take: 50,
          include: { course: { select: { code: true, title: true } } },
        }),
    ),
    withAuthorizedTransaction(
      prisma,
      auth,
      {
        permission: "workflow:definition_read",
        resourceClassification: "internal",
      },
      async (tx) =>
        tx.workflowDefinition.findMany({
          where: { tenantId },
          orderBy: { code: "asc" },
          take: 50,
        }),
    ),
    withAuthorizedTransaction(
      prisma,
      auth,
      {
        permission: "engagement:survey_read",
        resourceClassification: "confidential",
      },
      async (tx) =>
        tx.engagementSurvey.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
    ),
    withAuthorizedTransaction(
      prisma,
      auth,
      {
        permission: "integrations:webhook_subscription_write",
        resourceClassification: "confidential",
      },
      async (tx) =>
        tx.webhookSubscription.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
    ),
    withAuthorizedTransaction(
      prisma,
      auth,
      {
        permission: "benefits:cobra_read",
        resourceClassification: "confidential",
      },
      async (tx) =>
        tx.cobraEvent.findMany({
          where: { tenantId },
          orderBy: { qualifyingDate: "desc" },
          take: 50,
        }),
    ),
    withAuthorizedTransaction(
      prisma,
      auth,
      {
        permission: "compensation:cycle_read",
        resourceClassification: "confidential",
      },
      async (tx) =>
        tx.compensationRecommendation.findMany({
          where: { tenantId },
          orderBy: { updatedAt: "desc" },
          take: 50,
        }),
    ),
  ]);

  return {
    performanceCycles,
    compensationCycles,
    goalsForJordan,
    positions,
    learningCourses,
    learningEnrollments,
    workflowDefinitions,
    engagementSurveys,
    webhookSubscriptions,
    cobraEvents,
    compensationRecommendations,
  };
}

function StatusChip({ seeded }: { seeded: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
        seeded
          ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-100"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {seeded ? "Seeded" : "Empty"}
    </span>
  );
}

function SummaryCard({
  title,
  summary,
  seeded,
  anchorId,
}: {
  title: string;
  summary: string;
  seeded: boolean;
  anchorId: string;
}) {
  return (
    <a
      href={`#${anchorId}`}
      className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm outline-none ring-ring transition hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold tracking-tight text-card-foreground">{title}</h3>
        <StatusChip seeded={seeded} />
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
      <span className="text-xs font-medium text-primary">Jump to section →</span>
    </a>
  );
}

function EmptySectionPlaceholder() {
  return (
    <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
      <p>
        No rows loaded for this area. Run <code className={codeBox}>npm run demo:bootstrap</code>, confirm{" "}
        <code className={codeBox}>DEMO_TENANT_ID</code> in <code className={codeBox}>.env</code>, and check the Phase 3
        block in <code className={codeBox}>scripts/seed-phase3-demo.ts</code>.
      </p>
    </div>
  );
}

export default async function DemoCapabilitiesPage() {
  if (!isAnalyticsDemoMode()) {
    return (
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-6 py-10 font-sans">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Demo capability hub</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Enable local demo surfaces with <code className={codeBox}>ANALYTICS_DEMO_MODE=1</code> and{" "}
          <code className={codeBox}>DEMO_TENANT_ID</code> in <code className={codeBox}>.env</code> (development only).
          Then run <code className={codeBox}>npm run demo:bootstrap</code>.
        </p>
        <p className="mt-4">
          <Link href="/" className={linkClass}>
            Home
          </Link>
        </p>
      </main>
    );
  }

  let tenantId: string;
  try {
    tenantId = requireDemoTenantId();
  } catch {
    return (
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-6 py-10 font-sans">
        <p className="text-muted-foreground">
          Set <code className={codeBox}>DEMO_TENANT_ID</code> in <code className={codeBox}>.env</code>.
        </p>
        <Link href="/" className={`mt-4 inline-block ${linkClass}`}>
          Home
        </Link>
      </main>
    );
  }

  const s = await loadSnapshot(tenantId);

  const perfSeeded = s.performanceCycles.length > 0 || s.goalsForJordan.length > 0;
  const compSeeded = s.compensationCycles.length > 0 || s.compensationRecommendations.length > 0;
  const positionsSeeded = s.positions.length > 0;
  const learningSeeded = s.learningCourses.length > 0 || s.learningEnrollments.length > 0;
  const workflowSeeded = s.workflowDefinitions.length > 0;
  const engagementSeeded = s.engagementSurveys.length > 0;
  const integrationsSeeded = s.webhookSubscriptions.length > 0;
  const cobraSeeded = s.cobraEvents.length > 0;

  const toc = [
    { id: "sec-performance", label: "Performance" },
    { id: "sec-compensation", label: "Compensation" },
    { id: "sec-positions", label: "Positions" },
    { id: "sec-learning", label: "Learning" },
    { id: "sec-workflow", label: "Workflow" },
    { id: "sec-engagement", label: "Engagement" },
    { id: "sec-integrations", label: "Integrations" },
    { id: "sec-cobra", label: "Benefits / COBRA" },
    { id: "sec-api-parity", label: "API parity" },
  ] as const;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto max-w-6xl px-6 py-10 pb-16 font-sans text-foreground md:px-8"
    >
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Demo capability hub</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Read-only snapshot of Phase 3 seeds for tenant <code className={codeBox}>{tenantId}</code>. Summary cards and
          sections below mirror what <code className={codeBox}>npm run demo:bootstrap</code> loads into Postgres.
        </p>
      </header>

      <nav aria-labelledby="hub-toc-heading" className="mb-10 rounded-xl border border-border bg-muted/30 p-4 md:p-5">
        <p id="hub-toc-heading" className="text-sm font-semibold text-foreground">
          On this page
        </p>
        <ul className="mt-3 columns-1 gap-x-8 gap-y-2 text-sm sm:columns-2 md:columns-3" role="list">
          {toc.map((item) => (
            <li key={item.id} className="mb-2 break-inside-avoid list-none">
              <a href={`#${item.id}`} className={`${linkClass} text-sm`}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-labelledby="summary-heading" className="mb-12">
        <h2 id="summary-heading" className="sr-only">
          Summary counts
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Performance"
            summary={`${s.performanceCycles.length} cycle(s) · ${s.goalsForJordan.length} goal(s) for demo IC`}
            seeded={perfSeeded}
            anchorId="sec-performance"
          />
          <SummaryCard
            title="Compensation"
            summary={`${s.compensationCycles.length} cycle(s) · ${s.compensationRecommendations.length} recommendation(s)`}
            seeded={compSeeded}
            anchorId="sec-compensation"
          />
          <SummaryCard
            title="Positions"
            summary={`${s.positions.length} position row(s)`}
            seeded={positionsSeeded}
            anchorId="sec-positions"
          />
          <SummaryCard
            title="Learning"
            summary={`${s.learningCourses.length} course(s) · ${s.learningEnrollments.length} enrollment(s)`}
            seeded={learningSeeded}
            anchorId="sec-learning"
          />
          <SummaryCard
            title="Workflow"
            summary={`${s.workflowDefinitions.length} definition(s)`}
            seeded={workflowSeeded}
            anchorId="sec-workflow"
          />
          <SummaryCard
            title="Engagement"
            summary={`${s.engagementSurveys.length} survey(s)`}
            seeded={engagementSeeded}
            anchorId="sec-engagement"
          />
          <SummaryCard
            title="Integrations"
            summary={`${s.webhookSubscriptions.length} webhook subscription(s)`}
            seeded={integrationsSeeded}
            anchorId="sec-integrations"
          />
          <SummaryCard
            title="Benefits / COBRA"
            summary={`${s.cobraEvents.length} COBRA event(s)`}
            seeded={cobraSeeded}
            anchorId="sec-cobra"
          />
        </div>
      </section>

      <div className="flex flex-col gap-12">
        <section id="sec-performance" className="scroll-mt-28" aria-labelledby="sec-performance-heading">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="sec-performance-heading" className="text-lg font-semibold text-foreground">
              Performance
            </h2>
            <StatusChip seeded={perfSeeded} />
          </div>
          {!perfSeeded ? (
            <EmptySectionPlaceholder />
          ) : (
            <>
              <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground">
                {s.performanceCycles.slice(0, 8).map((c) => (
                  <li key={c.id}>
                    {c.name} — {c.status} ({c.startDate.toISOString().slice(0, 10)} →{" "}
                    {c.endDate.toISOString().slice(0, 10)})
                  </li>
                ))}
              </ul>
              {s.goalsForJordan.length > 0 ? (
                <ul className="mt-2 list-inside list-disc text-sm">
                  {s.goalsForJordan.slice(0, 8).map((g) => (
                    <li key={g.id}>
                      {g.title} — {g.status} (weight {g.weightBp} bp)
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </section>

        <section id="sec-compensation" className="scroll-mt-28" aria-labelledby="sec-compensation-heading">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="sec-compensation-heading" className="text-lg font-semibold text-foreground">
              Compensation
            </h2>
            <StatusChip seeded={compSeeded} />
          </div>
          {!compSeeded ? (
            <EmptySectionPlaceholder />
          ) : (
            <ul className="mt-3 list-inside list-disc text-sm">
              {s.compensationCycles.slice(0, 8).map((c) => (
                <li key={c.id}>
                  {c.name} — {c.cycleType} / {c.status} / {c.currencyCode}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="sec-positions" className="scroll-mt-28" aria-labelledby="sec-positions-heading">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="sec-positions-heading" className="text-lg font-semibold text-foreground">
              Positions
            </h2>
            <StatusChip seeded={positionsSeeded} />
          </div>
          {!positionsSeeded ? (
            <EmptySectionPlaceholder />
          ) : (
            <ul className="mt-3 list-inside list-disc text-sm">
              {s.positions.map((p) => (
                <li key={p.id}>
                  {p.code} — {p.title} ({p.status})
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="sec-learning" className="scroll-mt-28" aria-labelledby="sec-learning-heading">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="sec-learning-heading" className="text-lg font-semibold text-foreground">
              Learning
            </h2>
            <StatusChip seeded={learningSeeded} />
          </div>
          {!learningSeeded ? (
            <EmptySectionPlaceholder />
          ) : (
            <ul className="mt-3 list-inside list-disc text-sm">
              {s.learningCourses.map((c) => (
                <li key={c.id}>
                  {c.code} — {c.title} ({c.status})
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="sec-workflow" className="scroll-mt-28" aria-labelledby="sec-workflow-heading">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="sec-workflow-heading" className="text-lg font-semibold text-foreground">
              Workflow definitions
            </h2>
            <StatusChip seeded={workflowSeeded} />
          </div>
          {!workflowSeeded ? (
            <EmptySectionPlaceholder />
          ) : (
            <ul className="mt-3 list-inside list-disc text-sm">
              {s.workflowDefinitions.map((w) => (
                <li key={w.id}>
                  {w.code} — {w.name} ({w.kind}) {w.isActive ? "" : "(inactive)"}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="sec-engagement" className="scroll-mt-28" aria-labelledby="sec-engagement-heading">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="sec-engagement-heading" className="text-lg font-semibold text-foreground">
              Engagement
            </h2>
            <StatusChip seeded={engagementSeeded} />
          </div>
          {!engagementSeeded ? (
            <EmptySectionPlaceholder />
          ) : (
            <ul className="mt-3 list-inside list-disc text-sm">
              {s.engagementSurveys.map((e) => (
                <li key={e.id}>
                  {e.title} — {e.kind} / {e.status}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="sec-integrations" className="scroll-mt-28" aria-labelledby="sec-integrations-heading">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="sec-integrations-heading" className="text-lg font-semibold text-foreground">
              Webhook subscriptions
            </h2>
            <StatusChip seeded={integrationsSeeded} />
          </div>
          {!integrationsSeeded ? (
            <EmptySectionPlaceholder />
          ) : (
            <ul className="mt-3 list-inside list-disc text-sm break-all">
              {s.webhookSubscriptions.map((w) => (
                <li key={w.id}>
                  {w.label} → {w.targetUrl} {w.isActive ? "" : "(inactive)"}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="sec-cobra" className="scroll-mt-28" aria-labelledby="sec-cobra-heading">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="sec-cobra-heading" className="text-lg font-semibold text-foreground">
              COBRA events
            </h2>
            <StatusChip seeded={cobraSeeded} />
          </div>
          {!cobraSeeded ? (
            <EmptySectionPlaceholder />
          ) : (
            <ul className="mt-3 list-inside list-disc text-sm">
              {s.cobraEvents.map((e) => (
                <li key={e.id}>
                  {e.qualifyingEvent} — {e.electionStatus} (deadline {e.electionDeadline.toISOString().slice(0, 10)})
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          id="sec-api-parity"
          className="scroll-mt-28 rounded-lg border border-border bg-muted/40 p-4 text-sm"
          aria-labelledby="sec-api-parity-heading"
        >
          <h2 id="sec-api-parity-heading" className="text-base font-semibold text-foreground">
            API parity
          </h2>
          <p className="mt-2 text-muted-foreground">
            The same data is available under <code className={codeBox}>/api/v1/*</code> with a dev JWT (
            <code className={codeBox}>node scripts/issue-dev-jwt.mjs</code>
            ). OpenAPI:{" "}
            <a
              href="https://github.com/SafetyMP/HR-ERP/blob/main/contracts/openapi/core-hr-v1.yaml"
              className={linkClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              contracts/openapi/core-hr-v1.yaml
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
