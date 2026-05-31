"use client";

import { useCallback, useState } from "react";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { PageStateLoading } from "@/components/product/page-state";
import { StatusPill } from "@/components/product/status-pill";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TodayAttendanceApi } from "@/lib/attendance/today-attendance-types";
import { useTodayAttendanceQuery } from "@/lib/attendance/use-today-attendance-query";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";

export type { TodayAttendanceApi } from "@/lib/attendance/today-attendance-types";

function punchKindLabel(kind: string): string {
  switch (kind) {
    case "CLOCK_IN":
      return "Clock-in";
    case "CLOCK_OUT":
      return "Clock-out";
    default:
      return "Punch";
  }
}

function formatPunchClock(isoUtc: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeStyle: "short",
      timeZone,
    }).format(new Date(isoUtc));
  } catch {
    return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(isoUtc));
  }
}

type Props = {
  initialBearerToken?: string;
};

export function TimeAttendanceClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const { data: summary, isLoading, isError, error, refetch, isFetching } =
    useTodayAttendanceQuery();
  const [clockMessage, setClockMessage] = useState<string | null>(null);
  const [clockBusy, setClockBusy] = useState(false);

  const clockIn = useCallback(async () => {
    if (!isAuthenticated) return;
    setClockBusy(true);
    setClockMessage(null);
    try {
      const res = await hrApiFetch("/api/v1/attendance/clock-in", {
        bearerToken,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
      });

      const body = (await res.json()) as {
        error?: { message?: string };
      };

      if (res.ok) {
        setClockMessage("Your clock-in was recorded.");
        void refetch();
        return;
      }

      const raw = body.error?.message;
      if (raw === "already_clocked_in") {
        setClockMessage("You’re already clocked in for your current shift.");
      } else {
        setClockMessage("We couldn’t record your clock-in. Please try again.");
      }
    } catch {
      setClockMessage("We couldn’t record your clock-in. Please try again.");
    } finally {
      setClockBusy(false);
    }
  }, [isAuthenticated, bearerToken, refetch]);

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
        title="Time"
        description="Sign in to view today’s attendance and clock in."
        returnTo="/employee/time"
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
              We couldn&apos;t load your attendance
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please try again in a moment. If this keeps happening, contact Payroll.
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
            Your session could not be verified. Sign in again and return to Time.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => signOut()}>
          Sign out and start over
        </Button>
      </div>
    );
  }

  if (isLoading || !summary) {
    return <PageStateLoading label="Loading today's time…" />;
  }

  const tzNote =
    summary.timeZone !== "UTC"
      ? `Times use your organization calendar (${summary.timeZone}).`
      : "Times use the UTC calendar until a work location time zone is on file.";

  return (
    <div className="space-y-6">
      <div
        className={`rounded-xl border p-6 shadow-sm ${
          summary.clockedIn
            ? "border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20"
            : "border-border bg-card"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">
                {summary.clockedIn ? "You\u2019re clocked in" : "You\u2019re not clocked in"}
              </h2>
              <StatusPill variant={summary.clockedIn ? "success" : "neutral"}>
                {summary.clockedIn ? "On the clock" : "Off the clock"}
              </StatusPill>
            </div>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {summary.clockedIn
                ? "Your latest punch today is a clock-in. Clock out when your shift ends."
                : "Start your shift with clock-in when you're ready."}{" "}
              {tzNote}
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            disabled={clockBusy || summary.clockedIn}
            onClick={() => void clockIn()}
            className="shrink-0"
          >
            {clockBusy ? "Recording…" : "Clock in"}
          </Button>
        </div>
        {clockMessage ? (
          <p className="mt-4 text-sm font-medium text-foreground">{clockMessage}</p>
        ) : null}
      </div>

      {summary.punches.length === 0 ? (
        <Card className="border-dashed shadow-sm">
          <CardHeader>
            <CardTitle>No punches yet today</CardTitle>
            <CardDescription>
              There’s no clock-in or clock-out recorded for {summary.calendarDate} yet. When you start work, use{" "}
              <strong>Clock in</strong>
              — nothing is wrong with your account.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Today’s punches</CardTitle>
            <CardDescription>Work date {summary.calendarDate}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {summary.punches.map((p, i) => (
                <li key={`${p.kind}-${p.occurredAt}-${i}`} className="flex justify-between py-3 text-sm">
                  <span>{punchKindLabel(p.kind)}</span>
                  <span className="tabular-nums text-muted-foreground">
                    Punch time {formatPunchClock(p.occurredAt, summary.timeZone)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
