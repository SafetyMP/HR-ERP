"use client";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useHrAccess } from "@/lib/auth/use-hr-access";
import { formatBalanceHoursDisplay } from "@/lib/pto/format-balance-hours";
import type { PtoSummaryApiShape } from "@/lib/pto/pto-summary-types";
import { usePtoSummaryQuery } from "@/lib/pto/use-pto-summary-query";

export type { PtoSummaryApiShape } from "@/lib/pto/pto-summary-types";

type Props = {
  initialBearerToken?: string;
};

function formatCalendarDay(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(`${isoDate}T12:00:00.000Z`),
  );
}

export function PtoClient({ initialBearerToken }: Props) {
  const { ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const { data: summary, isLoading, isError, error, refetch, isFetching } =
    usePtoSummaryQuery();

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
        title="PTO"
        description="Sign in to view your PTO balance and recorded time off."
        returnTo="/employee/pto"
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
            <h2 className="text-lg font-semibold text-foreground">We couldn&apos;t load your PTO summary</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please try again in a moment. If this keeps happening, contact HR Operations.
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
            Your session could not be verified. Sign in again and return to PTO.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => signOut()}>
          Sign out and start over
        </Button>
      </div>
    );
  }

  if (isLoading || summary === undefined) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
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
      <p className="text-sm text-muted-foreground">
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
                <p className="text-3xl font-semibold tabular-nums text-foreground">
                  {formatBalanceHoursDisplay(summary.balanceHours)}{" "}
                  <span className="text-base font-normal text-muted-foreground">hours</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Balance as of {formatCalendarDay(summary.balanceAsOfDate)}.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
                No recorded time-off dates appear in your visible history yet.
              </p>
            ) : (
              <ul className="divide-y divide-border" role="list">
                {summary.recentTimeOff.map((row) => (
                  <li key={row.requestDate} className="py-3 text-sm text-foreground">
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
