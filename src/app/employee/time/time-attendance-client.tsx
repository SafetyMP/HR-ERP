"use client";

import {
  clearDevBearerTokenFromSession,
  readDevBearerTokenFromSession,
  writeDevBearerTokenToSession,
} from "@/lib/auth/dev-bearer-session";

import { startTransition, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


export type TodayAttendanceApi = {
  calendarDate: string;
  timeZone: string;
  clockedIn: boolean;
  punches: { kind: string; occurredAt: string }[];
};

async function fetchToday(token: string): Promise<{
  data: TodayAttendanceApi | null;
  ok: boolean;
  retryable: boolean;
}> {
  const res = await fetch("/api/v1/me/attendance/today", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (res.status === 401) {
    return { data: null, ok: false, retryable: false };
  }

  const body = (await res.json()) as {
    data?: { todayAttendance: TodayAttendanceApi };
    error?: { code?: string; message?: string };
  };

  if (!res.ok) {
    return { data: null, ok: false, retryable: res.status >= 500 };
  }

  const summary = body.data?.todayAttendance;
  if (!summary) {
    return { data: null, ok: false, retryable: true };
  }

  return {
    data: summary,
    ok: true,
    retryable: false,
  };
}

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
  const [token, setTokenState] = useState<string | null>(null);
  const [summary, setSummary] = useState<TodayAttendanceApi | undefined>(undefined);
  const [loadError, setLoadError] = useState<"auth" | "recoverable" | null>(null);
  const [clockMessage, setClockMessage] = useState<string | null>(null);
  const [clockBusy, setClockBusy] = useState(false);

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

  const applyFetchResult = useCallback(
    (result: { data: TodayAttendanceApi | null; ok: boolean; retryable: boolean }) => {
      if (!result.ok && !result.retryable) {
        setLoadError("auth");
        setSummary(undefined);
        return;
      }
      if (!result.ok) {
        setLoadError("recoverable");
        setSummary(undefined);
        return;
      }
      if (!result.data) {
        setLoadError("recoverable");
        setSummary(undefined);
        return;
      }
      setSummary(result.data);
    },
    [],
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    startTransition(() => {
      setLoadError(null);
      setSummary(undefined);
    });

    void (async () => {
      const result = await fetchToday(token);
      if (cancelled) return;
      applyFetchResult(result);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, applyFetchResult]);

  const reload = useCallback(() => {
    if (!token) return;
    startTransition(() => {
      setLoadError(null);
      setSummary(undefined);
    });
    void (async () => {
      const result = await fetchToday(token);
      applyFetchResult(result);
    })();
  }, [token, applyFetchResult]);

  const clockIn = useCallback(async () => {
    if (!token) return;
    setClockBusy(true);
    setClockMessage(null);
    try {
      const res = await fetch("/api/v1/attendance/clock-in", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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
        reload();
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
  }, [token, reload]);

  const devHint =
    process.env.NODE_ENV === "development" ? (
      <p className="mt-4 rounded-md border border-dashed border-zinc-300 p-3 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        Dev: issue JWT with{" "}
        <code className="font-mono">roles=[&quot;employee&quot;]</code>,{" "}
        <code className="font-mono">subject_employee_id</code>, and matching tenant —{" "}
        <code className="font-mono">node scripts/issue-dev-jwt.mjs</code>
      </p>
    ) : null;

  if (!token) {
    return (
      <Card className="mx-auto w-full max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle>Time</CardTitle>
          <CardDescription>
            Sign in to view today’s attendance. Your session token was not found on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="hrerp-token-time">
            Paste bearer token (development)
          </label>
          <textarea
            id="hrerp-token-time"
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
            We couldn’t load your attendance
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Please try again in a moment. If this keeps happening, contact Payroll.
          </p>
        </div>
        <Button type="button" onClick={() => reload()}>
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
            Your session could not be verified. Sign in again and return to Time.
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
        Loading today’s time…
      </p>
    );
  }

  const tzNote =
    summary.timeZone !== "UTC"
      ? `Times use your organization calendar (${summary.timeZone}).`
      : "Times use the UTC calendar until a work location time zone is on file.";

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            {summary.clockedIn ? "You’re clocked in" : "You’re not clocked in"}
          </CardTitle>
          <CardDescription>
            {summary.clockedIn
              ? "Your latest punch today is a clock-in. Clock out when your shift ends (when your employer enables clock-out in this app)."
              : "Start your shift with clock-in when you’re ready."}{" "}
            <span className="block pt-2 text-xs text-zinc-500">{tzNote}</span>
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap">
          <Button type="button" disabled={clockBusy || summary.clockedIn} onClick={() => void clockIn()}>
            {clockBusy ? "Recording…" : "Clock in"}
          </Button>
          {clockMessage ? (
            <p className="self-center text-sm text-zinc-700 dark:text-zinc-300">{clockMessage}</p>
          ) : null}
        </CardFooter>
      </Card>

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
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {summary.punches.map((p, i) => (
                <li key={`${p.kind}-${p.occurredAt}-${i}`} className="flex justify-between py-3 text-sm">
                  <span>{punchKindLabel(p.kind)}</span>
                  <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
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
