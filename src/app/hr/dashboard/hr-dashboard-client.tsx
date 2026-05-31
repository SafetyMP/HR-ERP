"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Briefcase, DollarSign, Heart, Users } from "lucide-react";

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

function DashboardSkeleton() {
  return <DashboardMetricsSkeleton />;
}

function HeadcountCard({ summary }: { summary: Summary }) {
  return (
    <MetricCard
      label="Headcount"
      icon={Users}
      value={summary.headcountActive}
      detail="Active employees"
    />
  );
}

function HiringCard({ summary }: { summary: Summary }) {
  return (
    <MetricCard
      label="Open requisitions"
      icon={Briefcase}
      href="/manager/recruiting"
      value={summary.openRequisitions}
      detail={
        summary.medianTimeToHireDays != null
          ? `Median time to hire: ${summary.medianTimeToHireDays} days`
          : "Hiring pipeline in-app — no separate ATS"
      }
    />
  );
}
function PayrollCard({ summary }: { summary: Summary }) {
  const hasIssues = summary.openPayrollExceptions > 0 || summary.periodsAwaitingLock > 0;
  return (
    <MetricCard
      label="Payroll close"
      icon={DollarSign}
      href="/hr/payroll-runs"
      accent={hasIssues ? "warning" : "default"}
      value={summary.openPayrollExceptions}
      detail={`${summary.periodsAwaitingLock} period${summary.periodsAwaitingLock === 1 ? "" : "s"} awaiting lock · native pay runs`}
    />
  );
}

function BenefitsCard({ summary }: { summary: Summary }) {
  const pending = summary.openLifeEvents + summary.pendingElectionIntents;
  return (
    <MetricCard
      label="Benefits queue"
      icon={Heart}
      href="/hr/benefits/life-events"
      accent={pending > 0 ? "warning" : "default"}
      value={pending}
      detail={`${summary.openLifeEvents} life events · ${summary.pendingElectionIntents} election intents`}
    />
  );
}

export function HrDashboardClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const [summary, setSummary] = useState<Summary | null | undefined>(undefined);

  const load = async () => {
    setSummary(undefined);
    const res = await hrApiFetch("/api/v1/hr/analytics/ops-summary", {
      bearerToken,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      setSummary(null);
      return;
    }
    const body = (await res.json()) as { data?: Summary };
    setSummary(body.data ?? null);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void load();
  }, [isAuthenticated, bearerToken]);

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Checking session…</p>;
  }
  if (!isAuthenticated) {
    return (
      <HrSignInCard
        title="HR dashboard"
        description="Sign in as HR to view operations summary."
        returnTo="/hr/dashboard"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (summary === undefined) {
    return <DashboardMetricsSkeleton />;
  }

  if (!summary) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Could not load dashboard.{" "}
          <Button type="button" variant="link" className="h-auto p-0" onClick={() => void load()}>
            Retry
          </Button>
        </p>
      </div>
    );
  }

  const needsAction =
    summary.openPayrollExceptions > 0 ||
    summary.periodsAwaitingLock > 0 ||
    summary.openLifeEvents > 0 ||
    summary.pendingElectionIntents > 0;

  const payrollFirst = summary.openPayrollExceptions > 0;

  return (
    <div className="flex flex-col gap-6">
      {needsAction ? (
        <Alert>
          <AlertTitle>Needs action</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              {summary.openPayrollExceptions > 0 ? (
                <li>
                  <Link href="/hr/payroll-runs" className="font-medium underline">
                    {summary.openPayrollExceptions} open payroll exception
                    {summary.openPayrollExceptions === 1 ? "" : "s"}
                  </Link>
                </li>
              ) : null}
              {summary.periodsAwaitingLock > 0 ? (
                <li>
                  <Link href="/hr/payroll-runs" className="font-medium underline">
                    {summary.periodsAwaitingLock} period
                    {summary.periodsAwaitingLock === 1 ? "" : "s"} awaiting lock
                  </Link>
                </li>
              ) : null}
              {summary.openLifeEvents > 0 ? (
                <li>
                  <Link href="/hr/benefits/life-events" className="font-medium underline">
                    {summary.openLifeEvents} pending life event
                    {summary.openLifeEvents === 1 ? "" : "s"}
                  </Link>
                </li>
              ) : null}
              {summary.pendingElectionIntents > 0 ? (
                <li>
                  <Link href="/hr/benefits/election-change-requests" className="font-medium underline">
                    {summary.pendingElectionIntents} election change intent
                    {summary.pendingElectionIntents === 1 ? "" : "s"}
                  </Link>
                </li>
              ) : null}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {payrollFirst ? (
          <>
            <PayrollCard summary={summary} />
            <HiringCard summary={summary} />
            <BenefitsCard summary={summary} />
            <HeadcountCard summary={summary} />
          </>
        ) : (
          <>
            <HeadcountCard summary={summary} />
            <HiringCard summary={summary} />
            <PayrollCard summary={summary} />
            <BenefitsCard summary={summary} />
          </>
        )}
      </div>

      {summary.headcountByDepartment.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Headcount by department</CardTitle>
            <CardDescription>Active employees grouped by department.</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 text-right font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {summary.headcountByDepartment.map((row) => (
                  <tr key={row.departmentId ?? "none"} className="border-t border-border">
                    <td className="py-2">{row.departmentId ?? "Unassigned"}</td>
                    <td className="py-2 text-right tabular-nums font-medium">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
