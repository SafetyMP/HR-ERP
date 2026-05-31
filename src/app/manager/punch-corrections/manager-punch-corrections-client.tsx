"use client";

import Link from "next/link";
import { useState } from "react";

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

type Props = {
  initialBearerToken?: string;
};

export function ManagerPunchCorrectionsClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer } = useHrAccess(initialBearerToken);
  const [employeeId, setEmployeeId] = useState("");
  const [punchKind, setPunchKind] = useState<"CLOCK_IN" | "CLOCK_OUT">("CLOCK_IN");
  const [requestedOccurredAt, setRequestedOccurredAt] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    if (!isAuthenticated) return;
    const occurredRaw = requestedOccurredAt.trim();
    const occurredAt = new Date(occurredRaw);
    if (!occurredRaw || Number.isNaN(occurredAt.getTime())) {
      setMsg("Pick a valid date and time for the punch.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await hrApiFetch("/api/v1/manager/team/attendance/correction-requests", {
        bearerToken,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          punchKind,
          requestedOccurredAt: occurredAt.toISOString(),
          reason,
        }),
      });
      if (!res.ok) {
        setMsg("Could not submit — verify the employeeId is your direct report.");
        return;
      }
      setMsg("Logged for HR / Payroll review.");
      setReason("");
    } finally {
      setBusy(false);
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
        title="Punch corrections"
        description="Sign in as a manager to propose punch corrections for your team."
        returnTo="/manager/punch-corrections"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Propose a punch correction</CardTitle>
        <CardDescription>
          Escalates to HR / Payroll for review. When HR approves, the correction becomes an authoritative punch in
          attendance. Use Core HR employee IDs (UUIDs).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-zinc-600 dark:text-zinc-400">
          Demo Jordan subject id for QA:{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">b0000001-0001-4000-8000-000000000011</code>
        </p>
        <div>
          <label className="font-medium text-zinc-700 dark:text-zinc-300" htmlFor="corr-emp">
            Employee ID
          </label>
          <input
            id="corr-emp"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="uuid"
          />
        </div>
        <div>
          <label className="font-medium text-zinc-700 dark:text-zinc-300" htmlFor="corr-kind">
            Punch kind
          </label>
          <select
            id="corr-kind"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            value={punchKind}
            onChange={(e) => setPunchKind(e.target.value as typeof punchKind)}
          >
            <option value="CLOCK_IN">Clock in</option>
            <option value="CLOCK_OUT">Clock out</option>
          </select>
        </div>
        <div>
          <label className="font-medium text-zinc-700 dark:text-zinc-300" htmlFor="corr-ts">
            Requested timestamp (ISO-local)
          </label>
          <input
            id="corr-ts"
            type="datetime-local"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            value={requestedOccurredAt}
            onChange={(e) => setRequestedOccurredAt(e.target.value)}
          />
        </div>
        <div>
          <label className="font-medium text-zinc-700 dark:text-zinc-300" htmlFor="corr-reason">
            Reason
          </label>
          <textarea
            id="corr-reason"
            rows={3}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        {msg ? <p className="text-zinc-700 dark:text-zinc-300">{msg}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={
              busy || reason.trim().length < 8 || !employeeId.trim() || !requestedOccurredAt.trim()
            }
            onClick={() => void submit()}
          >
            {busy ? "Sending…" : "Submit proposal"}
          </Button>
          <Button asChild variant="outline" type="button">
            <Link href="/manager/team-attendance">Team attendance today</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
