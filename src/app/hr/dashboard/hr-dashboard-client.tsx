"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  DollarSign,
  Heart,
  Inbox,
  UserRound,
  Users,
} from "lucide-react";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { MetricCard } from "@/components/product/metric-card";
import { DashboardMetricsSkeleton } from "@/components/product/page-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";

type Summary = {
  headcountActive: number;
  headcountByDepartment: { departmentId: string | null; count: number }[];
  openRequisitions: number;
  medianTimeToHireDays: number | null;
  openPayrollExceptions: number;
  periodsAwaitingLock: number;
  openLifeEvents: number;
  pendingElectionIntents: number;
};

type Props = { initialBearerToken?: string };

const HR_TASKS = [
  {
    href: "/hr/review-queue",
    label: "Requests & corrections",
    detail: "Review employee requests and updates",
    icon: Inbox,
  },
  {
    href: "/hr/payroll-runs",
    label: "Payroll runs",
    detail: "Review pay periods and resolve exceptions",
    icon: DollarSign,
  },
  {
    href: "/hr/benefits/election-change-requests",
    label: "Benefit change requests",
    detail: "Review requested coverage changes",
    icon: Heart,
  },
  {
    href: "/hr/benefits/life-events",
    label: "Life events",
    detail: "Manage employee benefit life events",
    icon: Heart,
  },
  {
    href: "/hr/onboarding-templates",
    label: "Onboarding templates",
    detail: "Prepare consistent new-hire checklists",
    icon: UserRound,
  },
];

export function HrDashboardClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer } =
    useHrAccess(initialBearerToken);
  const [summary, setSummary] = useState<Summary | null | undefined>(undefined);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    startTransition(() => setSummary(undefined));
    void (async () => {
      try {
        const res = await hrApiFetch("/api/v1/hr/analytics/ops-summary", {
          bearerToken,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          if (!cancelled) setSummary(null);
          return;
        }
        const body = (await res.json()) as { data?: Summary };
        if (!cancelled) setSummary(body.data ?? null);
      } catch {
        if (!cancelled) setSummary(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, bearerToken, retryAttempt]);

  if (!ready)
    return <p className="text-sm text-muted-foreground">Checking session…</p>;
  if (!isAuthenticated) {
    return (
      <HrSignInCard
        title="HR overview"
        description="Sign in as HR to review requests and manage daily operations."
        returnTo="/hr/dashboard"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  const needsAction =
    summary &&
    (summary.openPayrollExceptions > 0 ||
      summary.periodsAwaitingLock > 0 ||
      summary.openLifeEvents > 0 ||
      summary.pendingElectionIntents > 0);

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="hr-tasks-title">
        <h2
          id="hr-tasks-title"
          className="text-xl font-semibold tracking-tight"
        >
          Your daily operations
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Go straight to the work that needs your attention.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {HR_TASKS.map(({ href, label, detail, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-foreground">
                  {label}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  {detail}
                </span>
              </span>
              <ArrowRight
                className="mt-1 size-4 shrink-0 text-muted-foreground group-hover:text-primary"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="hr-summary-title" className="space-y-4">
        <h2
          id="hr-summary-title"
          className="text-xl font-semibold tracking-tight"
        >
          Operations at a glance
        </h2>
        {summary === undefined ? (
          <>
            <p role="status" className="text-sm text-muted-foreground">
              Loading operations summary…
            </p>
            <DashboardMetricsSkeleton />
          </>
        ) : null}
        {summary === null ? (
          <Alert>
            <AlertTitle>Operations summary unavailable</AlertTitle>
            <AlertDescription>
              You can still open any task above.{" "}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0"
                onClick={() => setRetryAttempt((attempt) => attempt + 1)}
              >
                Retry summary
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {summary ? (
          <>
            {needsAction ? (
              <Alert>
                <AlertTitle>Needs action</AlertTitle>
                <ul className="mt-2 list-inside list-disc space-y-2 text-sm text-muted-foreground">
                  {summary.openPayrollExceptions > 0 ? (
                    <li>
                      <Link
                        href="/hr/payroll-runs"
                        className="font-medium underline"
                      >
                        {summary.openPayrollExceptions} open payroll exception
                        {summary.openPayrollExceptions === 1 ? "" : "s"}
                      </Link>
                    </li>
                  ) : null}
                  {summary.periodsAwaitingLock > 0 ? (
                    <li>
                      <Link
                        href="/hr/payroll-runs"
                        className="font-medium underline"
                      >
                        {summary.periodsAwaitingLock} pay period
                        {summary.periodsAwaitingLock === 1 ? "" : "s"} awaiting
                        lock
                      </Link>
                    </li>
                  ) : null}
                  {summary.openLifeEvents > 0 ? (
                    <li>
                      <Link
                        href="/hr/benefits/life-events"
                        className="font-medium underline"
                      >
                        {summary.openLifeEvents} pending life event
                        {summary.openLifeEvents === 1 ? "" : "s"}
                      </Link>
                    </li>
                  ) : null}
                  {summary.pendingElectionIntents > 0 ? (
                    <li>
                      <Link
                        href="/hr/benefits/election-change-requests"
                        className="font-medium underline"
                      >
                        {summary.pendingElectionIntents} benefit change request
                        {summary.pendingElectionIntents === 1 ? "" : "s"}
                      </Link>
                    </li>
                  ) : null}
                </ul>
              </Alert>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payroll or benefit exceptions in this summary. Other employee
                requests are available in Requests & corrections.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Headcount"
                icon={Users}
                value={summary.headcountActive}
                detail="Active employees"
              />
              <MetricCard
                label="Payroll exceptions"
                icon={DollarSign}
                value={summary.openPayrollExceptions}
                detail={`${summary.periodsAwaitingLock} pay period${summary.periodsAwaitingLock === 1 ? "" : "s"} awaiting lock`}
              />
              <MetricCard
                label="Benefits awaiting review"
                icon={Heart}
                value={summary.openLifeEvents + summary.pendingElectionIntents}
                detail={`${summary.openLifeEvents} life events · ${summary.pendingElectionIntents} benefit changes`}
              />
              <MetricCard
                label="Open requisitions"
                icon={Briefcase}
                href="/manager/recruiting"
                value={summary.openRequisitions}
                detail={`Open recruiting in Manager workspace${summary.medianTimeToHireDays != null ? ` · median ${summary.medianTimeToHireDays} days to hire` : ""}`}
              />
            </div>
            {summary.headcountByDepartment.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Headcount by department</CardTitle>
                  <CardDescription>
                    Active employees grouped by department.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th scope="col" className="pb-2 font-medium">
                          Department
                        </th>
                        <th scope="col" className="pb-2 text-right font-medium">
                          Count
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.headcountByDepartment.map((row) => (
                        <tr
                          key={row.departmentId ?? "none"}
                          className="border-t border-border"
                        >
                          <td className="py-2">
                            {row.departmentId ?? "Unassigned"}
                          </td>
                          <td className="py-2 text-right font-medium tabular-nums">
                            {row.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}
