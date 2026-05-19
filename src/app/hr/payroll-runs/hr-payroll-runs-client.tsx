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
import { Input } from "@/components/ui/input";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";

type RunRow = {
  payrollPeriodId: string;
  startDate: string;
  endDate: string;
  label: string | null;
  paymentInstructionCount: number;
};

type Props = {
  initialBearerToken?: string;
};

export function HrPayrollRunsClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const [runs, setRuns] = useState<RunRow[] | undefined>(undefined);
  const [forbidden, setForbidden] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [periodId, setPeriodId] = useState("");
  const [reissue, setReissue] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reissueConfirm, setReissueConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = async () => {
    const res = await hrApiFetch("/api/v1/payroll/runs", {
      bearerToken,
      headers: { Accept: "application/json" },
    });
    if (res.status === 403) {
      setForbidden(true);
      setLoadFailed(false);
      setRuns([]);
      return;
    }
    if (!res.ok) {
      setLoadFailed(true);
      setRuns([]);
      return;
    }
    setLoadFailed(false);
    const body = (await res.json()) as { data?: { runs?: RunRow[] } };
    setRuns(body.data?.runs ?? []);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    startTransition(() => {
      setRuns(undefined);
      setForbidden(false);
    });
    void (async () => {
      await reload();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, bearerToken]);

  const executeRun = async () => {
    const id = periodId.trim();
    if (!id) {
      setMsg("Enter a payroll period ID (UUID).");
      return;
    }
    if (reissue && !reissueConfirm) {
      setMsg(
        "Confirm reissue below — existing payment instructions for this period may be replaced.",
      );
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await hrApiFetch("/api/v1/payroll/runs", {
        bearerToken,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payrollPeriodId: id,
          reissue,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        data?: {
          computed?: number;
          skipped?: number;
          withoutCompensation?: number;
        };
        error?: { message?: string };
      };
      if (!res.ok) {
        setMsg(body.error?.message ?? "Pay run failed.");
        return;
      }
      setMsg(
        `Run complete — computed ${body.data?.computed ?? 0}, skipped ${body.data?.skipped ?? 0}, without compensation ${body.data?.withoutCompensation ?? 0}.`,
      );
      await reload();
    } finally {
      setBusy(false);
    }
  };

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
        title="Payroll runs"
        description="Sign in with an HR payroll role to list periods and execute pay runs."
        returnTo="/hr/payroll-runs"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (forbidden) {
    return (
      <p className="text-sm text-muted-foreground">
        Your session cannot execute payroll runs. Use an HR admin dev JWT.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pay periods</CardTitle>
        <CardDescription>
          Recent payroll periods and payment instruction counts. Open a period for line-level
          detail.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => void reload()}>
            Reload
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-border p-4">
          <p className="text-sm font-medium text-foreground">Execute pay run</p>
          <Input
            placeholder="Payroll period ID (UUID)"
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className="font-mono text-xs"
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={reissue}
              onChange={(e) => {
                setReissue(e.target.checked);
                if (!e.target.checked) setReissueConfirm(false);
              }}
            />
            Reissue (replace existing instructions for this period)
          </label>
          {reissue ? (
            <label className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
              <input
                type="checkbox"
                checked={reissueConfirm}
                onChange={(e) => setReissueConfirm(e.target.checked)}
              />
              I understand prior payment instructions for this period may be replaced
            </label>
          ) : null}
          <Button type="button" onClick={() => void executeRun()} disabled={busy}>
            {busy ? "Running…" : "Run payroll"}
          </Button>
        </div>

        {loadFailed ? (
          <p className="text-sm text-muted-foreground">
            Could not load pay periods.{" "}
            <Button type="button" variant="link" className="h-auto p-0" onClick={() => void reload()}>
              Retry
            </Button>
          </p>
        ) : null}
        {runs === undefined ? (
          <p className="text-sm text-muted-foreground">Loading periods…</p>
        ) : runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payroll periods found.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border" role="list">
            {runs.map((r) => (
              <li key={r.payrollPeriodId} className="list-none px-4 py-3 text-sm">
                <Link
                  href={`/hr/payroll-runs/${r.payrollPeriodId}`}
                  className="font-medium text-primary underline underline-offset-4"
                >
                  {r.label ?? `${r.startDate} → ${r.endDate}`}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.startDate} → {r.endDate} · {r.paymentInstructionCount} payment instruction
                  {r.paymentInstructionCount === 1 ? "" : "s"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setPeriodId(r.payrollPeriodId);
                    setMsg(null);
                  }}
                >
                  Use for run
                </Button>
              </li>
            ))}
          </ul>
        )}
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      </CardContent>
    </Card>
  );
}
