"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { PayrollPeriodStatusBadge } from "@/components/hr/payroll-period-status";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { toast } from "sonner";
import { useHrAccess } from "@/lib/auth/use-hr-access";

type RunRow = {
  payrollPeriodId: string;
  startDate: string;
  endDate: string;
  label: string | null;
  status: string;
  paymentInstructionCount: number;
};

type FilterChip = "all" | "needs_close" | "locked";

type Props = {
  initialBearerToken?: string;
};

export function HrPayrollRunsClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const [runs, setRuns] = useState<RunRow[] | undefined>(undefined);
  const [forbidden, setForbidden] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [filter, setFilter] = useState<FilterChip>("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [periodId, setPeriodId] = useState("");
  const [reissue, setReissue] = useState(false);
  const [reissueConfirm, setReissueConfirm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
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

  const filteredRuns = useMemo(() => {
    if (!runs) return [];
    if (filter === "needs_close") {
      return runs.filter((r) => r.status === "COMPUTED");
    }
    if (filter === "locked") {
      return runs.filter(
        (r) => r.status === "LOCKED" || r.status === "ARTIFACT_GENERATED",
      );
    }
    return runs;
  }, [runs, filter]);

  const executeRun = async (targetPeriodId: string, opts?: { reissue?: boolean }) => {
    const useReissue = opts?.reissue ?? false;
    if (useReissue && !reissueConfirm) {
      setMsg(
        "Confirm reissue in Advanced options — existing payment instructions may be replaced.",
      );
      setShowAdvanced(true);
      return;
    }
    setBusyId(targetPeriodId);
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
          payrollPeriodId: targetPeriodId,
          reissue: useReissue,
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
        const errMsg = body.error?.message ?? "";
        toast.error(
          errMsg === "payroll_period_locked"
            ? "This period is locked — no further pay runs allowed."
            : errMsg || "Pay run failed.",
        );
        return;
      }
      toast.success(
        `Payroll run complete — ${body.data?.computed ?? 0} computed, ${body.data?.skipped ?? 0} skipped.`,
      );
      await reload();
    } finally {
      setBusyId(null);
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
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pay periods</CardTitle>
          <CardDescription>
            Run gross-to-net, resolve exceptions, lock the period, and generate filing
            packages — all in one place.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterChip)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="needs_close">Needs close</TabsTrigger>
              <TabsTrigger value="locked">Locked</TabsTrigger>
            </TabsList>
          </Tabs>

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
          ) : filteredRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No periods match this filter.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border" role="list">
              {filteredRuns.map((r) => (
                <li
                  key={r.payrollPeriodId}
                  className="list-none flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/hr/payroll-runs/${r.payrollPeriodId}`}
                        className="font-medium text-primary underline underline-offset-4"
                      >
                        {r.label ?? `${r.startDate} → ${r.endDate}`}
                      </Link>
                      <PayrollPeriodStatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.startDate} → {r.endDate} · {r.paymentInstructionCount} payment
                      instruction{r.paymentInstructionCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link href={`/hr/payroll-runs/${r.payrollPeriodId}`}>
                        Close period
                      </Link>
                    </Button>
                    {(r.status === "OPEN" || r.status === "COMPUTED") && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={busyId === r.payrollPeriodId}
                        onClick={() => void executeRun(r.payrollPeriodId)}
                      >
                        {busyId === r.payrollPeriodId ? "Running…" : "Run payroll"}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <details
            className="rounded-md border border-border p-4"
            open={showAdvanced}
            onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
          >
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              Advanced — manual period ID
            </summary>
            <div className="mt-4 flex flex-col gap-2">
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
                Reissue (replace existing instructions)
              </label>
              {reissue ? (
                <label className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                  <input
                    type="checkbox"
                    checked={reissueConfirm}
                    onChange={(e) => setReissueConfirm(e.target.checked)}
                  />
                  I understand prior payment instructions may be replaced
                </label>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                disabled={!periodId.trim() || busyId !== null}
                onClick={() => void executeRun(periodId.trim(), { reissue })}
              >
                Run for entered ID
              </Button>
            </div>
          </details>

          {msg ? (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {msg}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
