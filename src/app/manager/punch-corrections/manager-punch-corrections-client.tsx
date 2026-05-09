"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STORAGE_KEY = "hrerp_bearer_token";

type Props = {
  initialBearerToken?: string;
};

export function ManagerPunchCorrectionsClient({ initialBearerToken }: Props) {
  const [token, setTokenState] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [punchKind, setPunchKind] = useState<"CLOCK_IN" | "CLOCK_OUT">("CLOCK_IN");
  const [requestedOccurredAt, setRequestedOccurredAt] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    startTransition(() => {
      const fromStorage = sessionStorage.getItem(STORAGE_KEY)?.trim();
      if (fromStorage) setTokenState(fromStorage);
      else if (initialBearerToken?.trim()) {
        sessionStorage.setItem(STORAGE_KEY, initialBearerToken.trim());
        setTokenState(initialBearerToken.trim());
      }
    });
  }, [initialBearerToken]);

  const submit = async () => {
    if (!token) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/v1/manager/team/attendance/correction-requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          punchKind,
          requestedOccurredAt: new Date(requestedOccurredAt).toISOString(),
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

  if (!token) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Propose a punch correction</CardTitle>
        <CardDescription>
          Escalates to HR / Payroll — does not mutate authoritative punches automatically. Use Core HR employee IDs (UUIDs).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-zinc-600 dark:text-zinc-400">
          Demo Jordan subject id for QA: <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">b0000001-0001-4000-8000-000000000011</code>
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
          <Button type="button" disabled={busy || reason.trim().length < 8 || !employeeId.trim()} onClick={() => void submit()}>
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
