"use client";

import {
  clearDevBearerTokenFromSession,
  readDevBearerTokenFromSession,
  writeDevBearerTokenToSession,
} from "@/lib/auth/dev-bearer-session";

import { startTransition, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


type CaseRow = {
  id: string;
  employeeDisplayName: string;
  category: string;
  status: string;
  body: string;
  employeeVisibleNote: string | null;
};

type CorrRow = {
  id: string;
  employeeDisplayName: string;
  punchKind: string;
  requestedOccurredAt: string;
  reason: string;
};

type Props = {
  initialBearerToken?: string;
};

export function HrReviewQueueClient({ initialBearerToken }: Props) {
  const [token, setTokenState] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseRow[] | undefined>(undefined);
  const [corrs, setCorrs] = useState<CorrRow[] | undefined>(undefined);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    startTransition(() => {
      const fromStorage = readDevBearerTokenFromSession();
      if (fromStorage) setTokenState(fromStorage);
      else if (initialBearerToken?.trim()) {
        const t = writeDevBearerTokenToSession(initialBearerToken);
        if (t) setTokenState(t);
      }
    });
  }, [initialBearerToken]);

  const reload = () => {
    if (!token) return;
    startTransition(() => {
      setCases(undefined);
      setCorrs(undefined);
      setForbidden(false);
    });
    void (async () => {
      const [cRes, pRes] = await Promise.all([
        fetch("/api/v1/hr/case-requests/pending", {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
        fetch("/api/v1/hr/attendance/correction-requests/pending", {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
      ]);
      if (cRes.status === 403 || pRes.status === 403) {
        setForbidden(true);
        setCases([]);
        setCorrs([]);
        return;
      }
      const cBody = cRes.ok ? ((await cRes.json()) as { data?: { hrCaseRequestsPending?: CaseRow[] } }) : {};
      const pBody = pRes.ok ? ((await pRes.json()) as { data?: { attendanceCorrectionRequestsPending?: CorrRow[] } }) : {};
      setCases(cBody.data?.hrCaseRequestsPending ?? []);
      setCorrs(pBody.data?.attendanceCorrectionRequestsPending ?? []);
    })();
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload token-only
  }, [token]);

  const patchCase = async (requestId: string, status: string, note: string) => {
    if (!token) return;
    await fetch("/api/v1/hr/case-requests/review", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId,
        status,
        employeeVisibleNote: note.trim() ? note.trim() : null,
      }),
    });
    reload();
  };

  const patchCorr = async (correctionId: string, decision: "APPROVED" | "DENIED") => {
    if (!token) return;
    await fetch("/api/v1/hr/attendance/correction-requests/review", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ correctionId, decision }),
    });
    reload();
  };

  if (!token) return null;

  if (forbidden) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>HR or Payroll permissions required</CardTitle>
          <CardDescription>Triage queues need `case:hr_triage` and attendance correction review grants.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">HR case triage</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Non‑resolved intake tickets.</p>
        <div className="mt-4 space-y-4">
          {cases === undefined ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
          ) : cases.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Queue empty.</p>
          ) : (
            cases.map((c) => (
              <CaseRowEditor key={c.id} row={c} onApply={(status, note) => void patchCase(c.id, status, note)} />
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">Attendance correction proposals</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Manager-submitted adjustments awaiting HR/Payroll decision.</p>
        <div className="mt-4 space-y-4">
          {corrs === undefined ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
          ) : corrs.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No pending proposals.</p>
          ) : (
            corrs.map((r) => (
              <Card key={r.id} className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{r.employeeDisplayName}</CardTitle>
                  <CardDescription>
                    {r.punchKind} · {new Date(r.requestedOccurredAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-zinc-700 dark:text-zinc-300">{r.reason}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={() => void patchCorr(r.id, "APPROVED")}>
                      Approve record
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void patchCorr(r.id, "DENIED")}>
                      Deny
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function CaseRowEditor({
  row,
  onApply,
}: Readonly<{
  row: CaseRow;
  onApply: (status: string, note: string) => void;
}>) {
  const [status, setStatus] = useState(row.status);
  const [note, setNote] = useState(row.employeeVisibleNote ?? "");

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{row.employeeDisplayName}</CardTitle>
        <CardDescription>{row.category.replace(/_/g, " ")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-zinc-700 dark:text-zinc-300">{row.body}</p>
        <div>
          <label className="font-medium text-zinc-700 dark:text-zinc-300" htmlFor={`st-${row.id}`}>
            Status
          </label>
          <select
            id={`st-${row.id}`}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="NEEDS_INFO">Needs info</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <div>
          <label className="font-medium text-zinc-700 dark:text-zinc-300" htmlFor={`nt-${row.id}`}>
            Employee-visible note
          </label>
          <textarea
            id={`nt-${row.id}`}
            rows={2}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <Button type="button" size="sm" onClick={() => onApply(status, note)}>
          Save update
        </Button>
      </CardContent>
    </Card>
  );
}
