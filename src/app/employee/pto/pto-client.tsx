"use client";

import { startTransition, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBalanceHoursDisplay } from "@/lib/pto/format-balance-hours";

const STORAGE_KEY = "hrerp_bearer_token";

export type PtoSummaryApiShape = {
  balanceHours: number | null;
  balanceAsOfDate: string | null;
  recentTimeOff: { requestDate: string }[];
};

type Props = {
  initialBearerToken?: string;
};

function formatCalendarDay(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(`${isoDate}T12:00:00.000Z`),
  );
}

async function fetchPtoSummary(token: string): Promise<{
  summary: PtoSummaryApiShape | null;
  ok: boolean;
  retryable: boolean;
}> {
  const res = await fetch("/api/v1/me/pto/summary", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (res.status === 401) {
    return { summary: null, ok: false, retryable: false };
  }

  const body = (await res.json()) as {
    data?: { ptoSummary: PtoSummaryApiShape };
    error?: { code?: string; message?: string };
  };

  if (!res.ok) {
    return { summary: null, ok: false, retryable: res.status >= 500 };
  }

  return {
    summary: body.data?.ptoSummary ?? null,
    ok: true,
    retryable: false,
  };
}

export function PtoClient({ initialBearerToken }: Props) {
  const [token, setTokenState] = useState<string | null>(null);
  const [summary, setSummary] = useState<PtoSummaryApiShape | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<"auth" | "recoverable" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    startTransition(() => {
      const fromStorage = sessionStorage.getItem(STORAGE_KEY)?.trim();
      if (fromStorage) {
        setTokenState(fromStorage);
      } else if (initialBearerToken?.trim()) {
        sessionStorage.setItem(STORAGE_KEY, initialBearerToken.trim());
        setTokenState(initialBearerToken.trim());
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
      const result = await fetchPtoSummary(token);
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
      const result = await fetchPtoSummary(token);
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

  const devHint =
    process.env.NODE_ENV === "development" ? (
      <p className="mt-4 rounded-md border border-dashed border-zinc-300 p-3 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        Dev only: employee JWT needs <code className="font-mono">pto:self_read</code> (included in the employee role) plus{" "}
        <code className="font-mono">subject_employee_id</code>. Example:{" "}
        <code className="font-mono">
          DEV_ROLES=employee DEV_SUBJECT_EMPLOYEE_ID=… DEV_TENANT_ID=… node scripts/issue-dev-jwt.mjs
        </code>
      </p>
    ) : null;

  if (!token) {
    return (
      <Card className="mx-auto w-full max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle>PTO</CardTitle>
          <CardDescription>
            Sign in to view your PTO balance and recorded time off. Your session token was not found on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="hrerp-pto-token">
            Paste bearer token (development)
          </label>
          <textarea
            id="hrerp-pto-token"
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
            rows={3}
            placeholder="Bearer token from scripts/issue-dev-jwt.mjs"
            onChange={(e) => {
              const v = e.target.value.trim();
              if (v && typeof window !== "undefined") {
                sessionStorage.setItem(STORAGE_KEY, v);
                setTokenState(v);
              }
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
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">We couldn&apos;t load your PTO summary</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Please try again in a moment. If this keeps happening, contact HR Operations.
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
            Your session could not be verified. Sign in again and return to PTO.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            sessionStorage.removeItem(STORAGE_KEY);
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
        Loading your PTO summary…
      </p>
    );
  }

  if (summary === null) {
    return null;
  }

  const fullyEmpty =
    summary.balanceHours === null &&
    (!summary.recentTimeOff || summary.recentTimeOff.length === 0);

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Read-only snapshot of what HR has posted for you. To request new time off or fix an exception, use your usual HR
        or manager channel — not this screen.
      </p>

      {fullyEmpty ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>No PTO data on file yet</CardTitle>
            <CardDescription>
              We don&apos;t see a posted balance or recorded time-off dates for you. HR may still be setting up your
              leave plan, or your balances live in another system. Nothing is wrong with your account — check back after
              HR posts data or reach out to HR Operations if you expected numbers already.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!fullyEmpty ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>PTO balance</CardTitle>
            <CardDescription>Hours available according to the latest balance HR posted.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.balanceHours !== null && summary.balanceAsOfDate ? (
              <div>
                <p className="text-3xl font-semibold tabular-nums text-zinc-950 dark:text-white">
                  {formatBalanceHoursDisplay(summary.balanceHours)}{" "}
                  <span className="text-base font-normal text-zinc-600 dark:text-zinc-400">hours</span>
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Balance as of {formatCalendarDay(summary.balanceAsOfDate)}.
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                HR hasn&apos;t posted a PTO balance to your profile yet. You may still see recent recorded dates below if
                time off was logged on individual days.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {!fullyEmpty ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recorded time off</CardTitle>
            <CardDescription>Days HR recorded as time off for you (newest first).</CardDescription>
          </CardHeader>
          <CardContent>
            {!summary.recentTimeOff?.length ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No recorded time-off dates appear in your visible history yet.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800" role="list">
                {summary.recentTimeOff.map((row) => (
                  <li key={row.requestDate} className="py-3 text-sm text-zinc-900 dark:text-zinc-100">
                    {formatCalendarDay(row.requestDate)}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
