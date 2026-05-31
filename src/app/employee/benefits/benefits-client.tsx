"use client";

import Link from "next/link";
import { useMemo } from "react";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { PageStateLoading } from "@/components/product/page-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BENEFIT_CATEGORY_SORT_ORDER } from "@/lib/benefits/category-order";
import type {
  BenefitEnrollmentApiItem,
  BenefitsSummaryApiShape,
} from "@/lib/benefits/benefits-summary-types";
import { useBenefitsLifeEventsQuery } from "@/lib/benefits/use-benefits-life-events-query";
import { useBenefitsSummaryQuery } from "@/lib/benefits/use-benefits-summary-query";
import { useHrAccess } from "@/lib/auth/use-hr-access";

export type { BenefitEnrollmentApiItem, BenefitsSummaryApiShape } from "@/lib/benefits/benefits-summary-types";

type Props = {
  initialBearerToken?: string;
};

function formatEffectiveRange(fromIsoDate: string, toIsoDate: string | null): string {
  const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
  const start = fmt.format(new Date(`${fromIsoDate}T12:00:00.000Z`));
  if (!toIsoDate) return `${start} — ongoing`;
  const end = fmt.format(new Date(`${toIsoDate}T12:00:00.000Z`));
  return `${start} — ${end}`;
}

export function BenefitsClient({ initialBearerToken }: Props) {
  const { ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useBenefitsSummaryQuery();

  const { data: lifeEvents } = useBenefitsLifeEventsQuery();

  const pendingLifeEvent = useMemo(
    () =>
      (lifeEvents ?? []).some((e) => e.status === "SUBMITTED" || e.status === "HR_REVIEW"),
    [lifeEvents],
  );

  const grouped = useMemo(() => {
    if (!summary?.enrollments?.length) return [];
    const map = new Map<string, BenefitEnrollmentApiItem[]>();
    for (const e of summary.enrollments) {
      const list = map.get(e.category) ?? [];
      list.push(e);
      map.set(e.category, list);
    }
    return BENEFIT_CATEGORY_SORT_ORDER.filter((c) => (map.get(c)?.length ?? 0) > 0).map((c) => ({
      category: c,
      categoryLabel: map.get(c)![0].categoryLabel,
      rows: map.get(c)!,
    }));
  }, [summary]);

  if (!ready) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Checking your session…
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <HrSignInCard
        title="Benefits"
        description="Sign in to view your current benefit enrollments."
        returnTo="/employee/benefits"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (isError) {
    const recoverable =
      error instanceof Error &&
      !error.message.includes("401") &&
      !error.message.toLowerCase().includes("unauthorized");
    if (recoverable) {
      return (
        <div className="mx-auto w-full max-w-lg space-y-4">
          <div role="alert">
            <h2 className="text-lg font-semibold text-foreground">
              We couldn&apos;t load your Benefits summary
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please try again in a moment. If this keeps happening, contact your Benefits administrator.
            </p>
          </div>
          <Button type="button" onClick={() => void refetch()} disabled={isFetching}>
            Retry
          </Button>
        </div>
      );
    }
    return (
      <div className="mx-auto w-full max-w-lg space-y-4">
        <div role="alert">
          <h2 className="text-lg font-semibold text-foreground">Session issue</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your session could not be verified. Sign in again and return to Benefits.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => signOut()}>
          Sign out and start over
        </Button>
      </div>
    );
  }

  if (isLoading || summary === undefined) {
    return <PageStateLoading label="Loading your Benefits summary…" />;
  }

  if (!summary || summary.enrollments.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="mx-auto w-full max-w-lg shadow-sm">
          <CardHeader>
            <CardTitle>No enrollments on file</CardTitle>
            <CardDescription>
              We don&apos;t see active benefit elections for you yet. During open enrollment or after a qualifying life
              event, you can request a coverage change in-app — your Benefits team will review it.
            </CardDescription>
          </CardHeader>
          <CardFooterLink />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {pendingLifeEvent ? (
        <Alert>
          <AlertTitle>Life event in progress</AlertTitle>
          <AlertDescription>
            You have a life event under review.{" "}
            <Link href="/employee/benefits/life-events" className="font-medium underline">
              Track your life event
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Need a coverage change?</CardTitle>
          <CardDescription>
            Submit an election change request — HR will review during open enrollment or after a qualifying event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/employee/benefits/election-change">Request election change</Link>
          </Button>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Effective dates use {summary.calendarBasis === "UTC" ? "UTC calendar dates" : "the noted calendar basis"}.
      </p>
      {grouped.map((section) => (
        <Card key={section.category} className="overflow-hidden shadow-sm">
          <CardHeader className="border-b border-border bg-muted/20">
            <CardTitle className="text-lg">{section.categoryLabel}</CardTitle>
            <CardDescription>Current elections we have on record.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
            {section.rows.map((row, idx) => (
              <div
                key={`${row.category}-${row.planLabel}-${idx}`}
                className="rounded-xl border border-border bg-background/60 p-4"
              >
                <h3 className="text-base font-semibold text-foreground">{row.planLabel}</h3>
                {row.carrierName ? (
                  <p className="mt-1 text-sm text-muted-foreground">{row.carrierName}</p>
                ) : null}
                <dl className="mt-4 space-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Effective</dt>
                    <dd className="font-medium text-foreground">
                      {formatEffectiveRange(row.effectiveFrom, row.effectiveTo)}
                    </dd>
                  </div>
                  {row.dependentCount !== null && row.dependentCount !== undefined ? (
                    <div>
                      <dt className="text-muted-foreground">Dependents covered</dt>
                      <dd className="font-medium text-foreground">{row.dependentCount}</dd>
                    </div>
                  ) : null}
                  {row.electiveDeferralPercent !== null && row.electiveDeferralPercent !== undefined ? (
                    <div>
                      <dt className="text-muted-foreground">Elective deferral</dt>
                      <dd className="font-medium text-foreground">{row.electiveDeferralPercent}%</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CardFooterLink() {
  return (
    <CardContent className="pt-0">
      <Button asChild variant="outline" size="sm">
        <Link href="/employee/benefits/election-change">Request election change</Link>
      </Button>
    </CardContent>
  );
}
