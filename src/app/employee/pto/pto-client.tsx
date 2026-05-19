"use client";

import { startTransition, useCallback, useEffect, useState } from "react";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
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
import { formatBalanceHoursDisplay } from "@/lib/pto/format-balance-hours";


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

async function fetchPtoSummary(bearerToken: string | null): Promise<{
  summary: PtoSummaryApiShape | null;
  ok: boolean;
  retryable: boolean;
}> {
  const res = await hrApiFetch("/api/v1/me/pto/summary", {
    bearerToken,
    headers: { Accept: "application/json" },
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
  const { bearerToken, ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const [summary, setSummary] = useState<PtoSummaryApiShape | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<"auth" | "recoverable" | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    startTransition(() => {
      setLoadError(null);
      setSummary(undefined);
    });

    void (async () => {
      const result = await fetchPtoSummary(bearerToken);
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
  }, [isAuthenticated, bearerToken]);

  const retryLoad = useCallback(() => {
    if (!isAuthenticated) return;
    startTransition(() => {
      setLoadError(null);
      setSummary(undefined);
    });
    void (async () => {
      const result = await fetchPtoSummary(bearerToken);
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
  }, [isAuthenticated, bearerToken]);

  if (!ready) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        Checking your session…
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <HrSignInCard
        title="PTO"
        description="Sign in to view your PTO balance and recorded time off."
        returnTo="/employee/pto"
        onDevTokenPaste={persistBearer}
      />
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
        <Button type="button" variant="outline" onClick={() => signOut()}>
          Sign out and start over
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
