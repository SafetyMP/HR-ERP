"use client";

import {
  clearDevBearerTokenFromSession,
  readDevBearerTokenFromSession,
  writeDevBearerTokenToSession,
} from "@/lib/auth/dev-bearer-session";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BENEFIT_CATEGORY_SORT_ORDER } from "@/lib/benefits/category-order";


export type BenefitEnrollmentApiItem = {
  category: string;
  categoryLabel: string;
  planLabel: string;
  carrierName: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  dependentCount: number | null;
  electiveDeferralPercent: number | null;
};

export type BenefitsSummaryApiShape = {
  calendarBasis: string;
  enrollments: BenefitEnrollmentApiItem[];
};

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

async function fetchBenefitsSummary(token: string): Promise<{
  summary: BenefitsSummaryApiShape | null;
  ok: boolean;
  retryable: boolean;
}> {
  const res = await fetch("/api/v1/me/benefits/summary", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (res.status === 401) {
    return { summary: null, ok: false, retryable: false };
  }

  const body = (await res.json()) as {
    data?: { benefitsSummary: BenefitsSummaryApiShape };
    error?: { code?: string; message?: string };
  };

  if (!res.ok) {
    const retryable = res.status >= 500;
    return { summary: null, ok: false, retryable };
  }

  return {
    summary: body.data?.benefitsSummary ?? null,
    ok: true,
    retryable: false,
  };
}

export function BenefitsClient({ initialBearerToken }: Props) {
  const [token, setTokenState] = useState<string | null>(null);
  const [summary, setSummary] = useState<BenefitsSummaryApiShape | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<"auth" | "recoverable" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    startTransition(() => {
      const fromStorage = readDevBearerTokenFromSession();
      if (fromStorage) {
        setTokenState(fromStorage);
      } else if (initialBearerToken?.trim()) {
        const t = writeDevBearerTokenToSession(initialBearerToken);
        if (t) setTokenState(t);
      }
    });
  }, [initialBearerToken]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    startTransition(() => {
      setLoadError(null);
      setSummary(undefined);
    });

    void (async () => {
      const result = await fetchBenefitsSummary(token);
      if (cancelled) return;
      if (!result.ok && !result.retryable) {
        setLoadError("auth");
        setSummary(null);
        return;
      }
      if (!result.ok) {
        setLoadError("recoverable");
        setSummary(null);
        return;
      }
      setSummary(result.summary);
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const retryLoad = useCallback(() => {
    if (!token) return;
    startTransition(() => {
      setLoadError(null);
      setSummary(undefined);
    });
    void (async () => {
      const result = await fetchBenefitsSummary(token);
      if (!result.ok && !result.retryable) {
        setLoadError("auth");
        setSummary(null);
        return;
      }
      if (!result.ok) {
        setLoadError("recoverable");
        setSummary(null);
        return;
      }
      setSummary(result.summary);
    })();
  }, [token]);

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

  const devHint =
    process.env.NODE_ENV === "development" ? (
      <p className="mt-4 rounded-md border border-dashed border-zinc-300 p-3 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        Dev only: issue a JWT with <code className="font-mono">roles=[&quot;employee&quot;]</code>,{" "}
        <code className="font-mono">benefits:read</code> implied for employee role, and{" "}
        <code className="font-mono">subject_employee_id</code> set to your seeded employee id. Example:{" "}
        <code className="font-mono">
          DEV_ROLES=employee DEV_SUBJECT_EMPLOYEE_ID=… DEV_TENANT_ID=… node scripts/issue-dev-jwt.mjs
        </code>
      </p>
    ) : null;

  if (!token) {
    return (
      <Card className="mx-auto w-full max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle>Benefits</CardTitle>
          <CardDescription>
            Sign in to view your current benefit enrollments. Your session token was not found on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="hrerp-benefits-token">
            Paste bearer token (development)
          </label>
          <textarea
            id="hrerp-benefits-token"
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
            rows={3}
            placeholder="Bearer token from scripts/issue-dev-jwt.mjs"
            onChange={(e) => {
              const t = writeDevBearerTokenToSession(e.target.value);
              if (t) setTokenState(t);
            }}
          />
          {devHint}
        </CardContent>
      </Card>
    );
  }

  if (loadError === "recoverable") {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4">
        <div role="alert">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            We couldn&apos;t load your Benefits summary
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Please try again in a moment. If this keeps happening, contact your Benefits administrator.
          </p>
        </div>
        <Button type="button" onClick={() => retryLoad()}>
          Retry
        </Button>
      </div>
    );
  }

  if (loadError === "auth") {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4">
        <div role="alert">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Session issue</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Your session could not be verified. Sign in again and return to Benefits.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            clearDevBearerTokenFromSession();
            setTokenState(null);
            setLoadError(null);
            setSummary(undefined);
          }}
        >
          Clear token and start over
        </Button>
      </div>
    );
  }

  if (summary === undefined) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        Loading your Benefits summary…
      </p>
    );
  }

  if (!summary || summary.enrollments.length === 0) {
    return (
      <Card className="mx-auto w-full max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle>No enrollments on file</CardTitle>
          <CardDescription>
            We don&apos;t see active benefit elections for you yet. During open enrollment or after a qualifying life
            event, contact your Benefits administrator to confirm what&apos;s available and how to enroll. Nothing is
            wrong with your account — this page only shows enrollments already recorded for you.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Effective dates use {summary.calendarBasis === "UTC" ? "UTC calendar dates" : "the noted calendar basis"}.
      </p>
      {grouped.map((section) => (
        <Card key={section.category} className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{section.categoryLabel}</CardTitle>
            <CardDescription>Current elections we have on record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {section.rows.map((row, idx) => (
              <div
                key={`${row.category}-${row.planLabel}-${idx}`}
                className="border-b border-zinc-100 pb-6 last:border-b-0 last:pb-0 dark:border-zinc-800"
              >
                <h3 className="text-base font-semibold text-zinc-950 dark:text-white">{row.planLabel}</h3>
                {row.carrierName ? (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{row.carrierName}</p>
                ) : null}
                <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">Effective: </span>
                  {formatEffectiveRange(row.effectiveFrom, row.effectiveTo)}
                </p>
                {row.dependentCount !== null && row.dependentCount !== undefined ? (
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                    Dependents covered: {row.dependentCount}
                  </p>
                ) : null}
                {row.electiveDeferralPercent !== null && row.electiveDeferralPercent !== undefined ? (
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                    Elective deferral (payroll): {row.electiveDeferralPercent}%
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
