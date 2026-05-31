"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";

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


type PunchDto = { kind: string; occurredAt: string };

type Member = {
  employeeId: string;
  displayName: string;
  calendarDate: string;
  timeZone: string;
  clockedIn: boolean;
  openShiftFromPriorDay?: boolean;
  punches: PunchDto[];
};

type Props = {
  initialBearerToken?: string;
};

async function fetchTeamAttendance(bearerToken: string | null): Promise<{
  members: Member[] | null;
  ok: boolean;
  auth: boolean;
  forbidden: boolean;
}> {
  const res = await hrApiFetch("/api/v1/manager/team/attendance/today", {
    bearerToken, 
    headers: { Accept: "application/json" },
  })
  if (res.status === 401) {
    return { members: null, ok: false, auth: true, forbidden: false };
  }
  if (res.status === 403) {
    return { members: null, ok: false, auth: false, forbidden: true };
  }
  if (!res.ok) {
    return { members: null, ok: false, auth: false, forbidden: false };
  }
  const body = (await res.json()) as {
    data?: { managerTeamAttendance?: { members: Member[] } };
  };
  return {
    members: body.data?.managerTeamAttendance?.members ?? [],
    ok: true,
    auth: false,
    forbidden: false,
  };
}

export function TeamAttendanceClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer } =
    useHrAccess(initialBearerToken);
  const [members, setMembers] = useState<Member[] | undefined>(undefined);
  const [loadError, setLoadError] = useState<"auth" | "forbidden" | "recoverable" | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    startTransition(() => {
      setLoadError(null);
      setMembers(undefined);
    });

    void (async () => {
      const result = await fetchTeamAttendance(bearerToken);
      if (cancelled) return;
      if (!result.ok && result.auth) {
        setLoadError("auth");
        setMembers([]);
        return;
      }
      if (!result.ok && result.forbidden) {
        setLoadError("forbidden");
        setMembers([]);
        return;
      }
      if (!result.ok) {
        setLoadError("recoverable");
        setMembers([]);
        return;
      }
      setMembers(result.members ?? []);
      setLoadError(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, bearerToken]);

  const retryLoad = () => {
    if (!isAuthenticated) return;
    startTransition(() => {
      setLoadError(null);
      setMembers(undefined);
    });
    void (async () => {
      const result = await fetchTeamAttendance(bearerToken);
      if (!result.ok && result.auth) {
        setLoadError("auth");
        setMembers([]);
        return;
      }
      if (!result.ok && result.forbidden) {
        setLoadError("forbidden");
        setMembers([]);
        return;
      }
      if (!result.ok) {
        setLoadError("recoverable");
        setMembers([]);
        return;
      }
      setMembers(result.members ?? []);
      setLoadError(null);
    })();
  };

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
        title="Team attendance"
        description="Sign in as a manager to view team attendance."
        returnTo="/manager/team-attendance"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (loadError === "forbidden") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manager access required</CardTitle>
          <CardDescription>
            Sign in with a manager (or HR) role that includes team attendance visibility. Employees should use the Time page for
            their own punches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/employee/time">Go to my time</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loadError === "recoverable") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Couldn&apos;t load your team&apos;s attendance.</p>
        <Button type="button" onClick={() => retryLoad()}>
          Retry
        </Button>
      </div>
    );
  }

  if (loadError === "auth") {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Session issue — sign in again.</p>;
  }

  if (members === undefined) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading team attendance…</p>;
  }

  return (
    <div className="space-y-4">
      {members.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No direct reports</CardTitle>
            <CardDescription>
              We don&apos;t see employees reporting to you in Core HR yet. When headcount data is wired, their punch summary will
              appear here for today&apos;s calendar date in each person&apos;s attendance timezone.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-3" role="list">
          {members.map((m) => (
            <li key={m.employeeId}>
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{m.displayName}</CardTitle>
                  <CardDescription>
                    Today ({m.calendarDate}) · {m.timeZone}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="font-medium">{m.clockedIn ? "Clocked in" : "Not clocked in"}</div>
                  {m.openShiftFromPriorDay && m.clockedIn ? (
                    <div className="mt-1 text-amber-700 dark:text-amber-300">
                      Open shift carried over from a prior work day
                    </div>
                  ) : null}
                  <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                    {m.punches.length} punch{m.punches.length === 1 ? "" : "es"} recorded today
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
