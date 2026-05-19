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


type Row = {
  id: string;
  employeeDisplayName: string;
  startDate: string;
  endDate: string;
  status: string;
  note: string | null;
};

type Props = {
  initialBearerToken?: string;
};

async function fetchRows(bearerToken: string | null): Promise<{ rows: Row[] | null; ok: boolean; forbidden: boolean }> {
  const res = await hrApiFetch("/api/v1/manager/team/time-off/requests", {
    bearerToken,
    headers: { Accept: "application/json" },
  });
  if (res.status === 403) return { rows: null, ok: false, forbidden: true };
  if (!res.ok) return { rows: null, ok: false, forbidden: false };
  const body = (await res.json()) as { data?: { managerTeamTimeOffRequests?: Row[] } };
  return {
    rows: body.data?.managerTeamTimeOffRequests ?? [],
    ok: true,
    forbidden: false,
  };
}

export function ManagerTeamLeaveClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer } =
    useHrAccess(initialBearerToken);
  const [rows, setRows] = useState<Row[] | undefined>(undefined);
  const [forbidden, setForbidden] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    startTransition(() => {
      setRows(undefined);
      setForbidden(false);
    });
    void (async () => {
      const result = await fetchRows(bearerToken);
      if (cancelled) return;
      if (result.forbidden) {
        setForbidden(true);
        setRows([]);
        return;
      }
      if (!result.ok || result.rows === null) {
        setRows([]);
        return;
      }
      setRows(result.rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, bearerToken]);

  const decide = async (requestId: string, decision: "APPROVED" | "DENIED") => {
    if (!isAuthenticated) return;
    setBusyId(requestId);
    try {
      const res = await hrApiFetch("/api/v1/manager/team/time-off/decision", {
        bearerToken,
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId, decision }),
      });
      if (!res.ok) return;
      const refreshed = await fetchRows(bearerToken);
      if (refreshed.rows) setRows(refreshed.rows);
    } finally {
      setBusyId(null);
    }
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
        title="Team leave"
        description="Sign in as a manager to review team leave requests."
        returnTo="/manager/team-leave"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (forbidden) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manager permissions required</CardTitle>
          <CardDescription>Sign in with a manager-capable token that includes leave approvals for your direct reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/employee/pto">Back to my PTO</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (rows === undefined) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading team leave queue…</p>;
  }

  const pending = rows.filter((r) => r.status === "PENDING");

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Pending multi-day requests from people who report to you in Core HR. Audit-friendly decisions post immediately for employees to
        review on their PTO page.
      </p>
      {pending.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No pending leave decisions</CardTitle>
            <CardDescription>When teammates submit ranges, they&apos;ll queue here.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-3" role="list">
          {pending.map((r) => (
            <li key={r.id}>
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{r.employeeDisplayName}</CardTitle>
                  <CardDescription>
                    {r.startDate} — {r.endDate}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {r.note ? <p className="text-zinc-700 dark:text-zinc-300">&ldquo;{r.note}&rdquo;</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyId === r.id}
                      onClick={() => void decide(r.id, "APPROVED")}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === r.id}
                      onClick={() => void decide(r.id, "DENIED")}
                    >
                      Deny
                    </Button>
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
