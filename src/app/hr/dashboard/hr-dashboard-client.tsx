"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
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
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading dashboard">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-36 animate-pulse rounded-lg border border-border bg-muted/50" />
      ))}
    </div>
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
    return (
      <div className="flex flex-col gap-6">
        <DashboardSkeleton />
      </div>
    );
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
    </div>
  );
}

function HeadcountCard({ summary }: { summary: Summary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Headcount</CardTitle>
        <CardDescription>Active employees</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{summary.headcountActive}</p>
        {summary.headcountByDepartment.length > 0 ? (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-1 font-medium">Department</th>
                <th className="pb-1 text-right font-medium">Count</th>
              </tr>
            </thead>
            <tbody>
              {summary.headcountByDepartment.map((row) => (
                <tr key={row.departmentId ?? "none"}>
                  <td className="py-1">{row.departmentId ?? "Unassigned"}</td>
                  <td className="py-1 text-right tabular-nums">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </CardContent>
    </Card>
  );
}

function HiringCard({ summary }: { summary: Summary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hiring</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-3xl font-semibold tabular-nums">{summary.openRequisitions}</p>
        <p className="text-sm text-muted-foreground">Open requisitions</p>
        <p className="text-sm">
          Median time to hire:{" "}
          {summary.medianTimeToHireDays != null
            ? `${summary.medianTimeToHireDays} days`
            : "—"}
        </p>
        <Button type="button" size="sm" asChild>
          <Link href="/manager/recruiting">Open recruiting</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function PayrollCard({ summary }: { summary: Summary }) {
  return (
    <Card className={summary.openPayrollExceptions > 0 ? "border-amber-500/50" : undefined}>
      <CardHeader>
        <CardTitle>Payroll close</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm">
          Open exceptions:{" "}
          <span className="text-2xl font-semibold tabular-nums">
            {summary.openPayrollExceptions}
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Periods awaiting lock: {summary.periodsAwaitingLock}
        </p>
        <Button type="button" size="sm" asChild>
          <Link href="/hr/payroll-runs">
            {summary.openPayrollExceptions > 0
              ? "Review exceptions"
              : "Open pay runs"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function BenefitsCard({ summary }: { summary: Summary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Benefits</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm">
          Pending life events:{" "}
          <span className="text-2xl font-semibold tabular-nums">{summary.openLifeEvents}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Election change intents: {summary.pendingElectionIntents}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" asChild>
            <Link href="/hr/benefits/life-events">Life event queue</Link>
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href="/hr/benefits/election-change-requests">Election intents</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
