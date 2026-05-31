"use client";

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
import { readApiErrorMessage } from "@/lib/api/v1/read-api-error-message";
import { toast } from "sonner";
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
  const { bearerToken, ready, isAuthenticated, persistBearer } =
    useHrAccess(initialBearerToken);
  const [cases, setCases] = useState<CaseRow[] | undefined>(undefined);
  const [corrs, setCorrs] = useState<CorrRow[] | undefined>(undefined);
  const [forbidden, setForbidden] = useState(false);
  const [busyCorrId, setBusyCorrId] = useState<string | null>(null);

  const reload = () => {
    if (!isAuthenticated) return;
    startTransition(() => {
      setCases(undefined);
      setCorrs(undefined);
      setForbidden(false);
    });
    void (async () => {
      const [cRes, pRes] = await Promise.all([
        hrApiFetch("/api/v1/hr/case-requests/pending", {
          bearerToken,
          headers: { Accept: "application/json" },
        }),
        hrApiFetch("/api/v1/hr/attendance/correction-requests/pending", {
          bearerToken,
          headers: { Accept: "application/json" },
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
  }, [isAuthenticated, bearerToken]);

  const patchCase = async (requestId: string, status: string, note: string) => {
    if (!isAuthenticated) return;
    await hrApiFetch("/api/v1/hr/case-requests/review", {
      bearerToken,
      method: "PATCH",
      headers: {
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
    if (!isAuthenticated) return;
    setBusyCorrId(correctionId);
    try {
      const res = await hrApiFetch("/api/v1/hr/attendance/correction-requests/review", {
        bearerToken,
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correctionId, decision }),
      });
      if (!res.ok) {
        toast.error(
          await readApiErrorMessage(
            res,
            "We couldn't record that correction decision. Refresh and try again.",
          ),
        );
        return;
      }
      if (decision === "APPROVED") {
        const body = (await res.json()) as {
          data?: { attendanceCorrectionRequest?: { appliedPunchId?: string | null } };
        };
        if (body.data?.attendanceCorrectionRequest?.appliedPunchId) {
          toast.success("Correction approved — punch recorded in attendance.");
        } else {
          toast.success("Correction approved.");
        }
      } else {
        toast.success("Correction denied.");
      }
      reload();
    } finally {
      setBusyCorrId(null);
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
        title="Review queue"
        description="Sign in to access the HR review queue."
        returnTo="/hr/review-queue"
        onDevTokenPaste={persistBearer}
      />
    );
  }

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
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manager-submitted adjustments awaiting HR/Payroll decision. Approving writes an authoritative attendance punch.
        </p>
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
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyCorrId === r.id}
                      onClick={() => void patchCorr(r.id, "APPROVED")}
                    >
                      Approve record
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyCorrId === r.id}
                      onClick={() => void patchCorr(r.id, "DENIED")}
                    >
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
