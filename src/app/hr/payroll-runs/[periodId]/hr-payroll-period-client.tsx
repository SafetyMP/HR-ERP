"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { HrPageShell } from "@/components/hr/hr-page-shell";

import { HrPayrollPeriodSummary } from "./hr-payroll-period-summary";
import { PayrollPeriodStatusBadge } from "@/components/hr/payroll-period-status";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";
import { buildPeriodDetailCsv } from "@/lib/payroll/export-period-detail-csv";
import { formatMoneyMinor } from "@/lib/paystub/format-money";
import { payrollExceptionLabel } from "@/lib/ui/payroll-exception-label";
import { parseMemoFingerprint } from "@/lib/ui/parse-payroll-memo";

type Line = {
  lineType: string;
  sortOrder: number;
  amountMinor: number;
  currencyCode: string;
};

type Instruction = {
  paymentInstructionId: string;
  employeeId: string;
  employeeName: string;
  memo: string | null;
  lines: Line[];
};

type PayrollException = {
  id: string;
  employeeName: string;
  code: string;
  status: string;
  resolutionNote: string | null;
};

type Detail = {
  payrollPeriodId: string;
  startDate: string;
  endDate: string;
  label: string | null;
  status: string;
  lockedAt: string | null;
  openExceptionCount: number;
  paymentInstructions: Instruction[];
};

type Props = {
  periodId: string;
  initialBearerToken?: string;
};

function netFromLines(lines: Line[]): number {
  let net = 0;
  for (const l of lines) {
    const sign = l.lineType === "DEDUCTION" || l.lineType === "TAX" ? -1 : 1;
    net += sign * l.amountMinor;
  }
  return net;
}

export function HrPayrollPeriodClient({ periodId, initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const [detail, setDetail] = useState<Detail | null | undefined>(undefined);
  const [exceptions, setExceptions] = useState<PayrollException[]>([]);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resolveNotes, setResolveNotes] = useState<Record<string, string>>({});

  const reload = async () => {
    const res = await hrApiFetch(`/api/v1/payroll/runs/${periodId}`, {
      bearerToken,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      setDetail(null);
      return;
    }
    const body = (await res.json()) as { data?: Detail };
    setDetail(body.data ?? null);

    const exRes = await hrApiFetch(`/api/v1/payroll/runs/${periodId}/exceptions`, {
      bearerToken,
      headers: { Accept: "application/json" },
    });
    if (exRes.ok) {
      const exBody = (await exRes.json()) as {
        data?: { exceptions?: PayrollException[] };
      };
      setExceptions(exBody.data?.exceptions ?? []);
    } else {
      setExceptions([]);
    }
  };

  const lockPeriod = async () => {
    if (!window.confirm("Lock this period? No further pay runs until counsel approves unlock.")) {
      return;
    }
    setBusy(true);
    setActionMsg(null);
    try {
      const res = await hrApiFetch(`/api/v1/payroll/runs/${periodId}/lock`, {
        bearerToken,
        method: "POST",
        headers: { Accept: "application/json" },
      });
      setActionMsg(
        res.ok ? "Period locked." : "Could not lock — run payroll and resolve blockers first.",
      );
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const generateFiling = async () => {
    setBusy(true);
    setActionMsg(null);
    try {
      const res = await hrApiFetch(
        `/api/v1/payroll/runs/${periodId}/filing-artifact`,
        {
          bearerToken,
          method: "POST",
          headers: { Accept: "application/json" },
        },
      );
      if (!res.ok) {
        setActionMsg("Could not generate filing package — lock the period first.");
        return;
      }
      const body = (await res.json()) as { data?: { payloadHash?: string } };
      setActionMsg(
        `Filing artifact generated (hash ${body.data?.payloadHash?.slice(0, 12) ?? "…"}). Not agency-submitted.`,
      );
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const downloadFilingJson = async () => {
    const res = await hrApiFetch(
      `/api/v1/payroll/runs/${periodId}/filing-artifact`,
      { bearerToken, headers: { Accept: "application/json" } },
    );
    if (!res.ok) {
      setActionMsg("No filing artifact yet — generate one after locking.");
      return;
    }
    const body = (await res.json()) as { data?: unknown };
    const blob = new Blob([JSON.stringify(body.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `filing-artifact-${periodId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPartner = async () => {
    setBusy(true);
    setActionMsg(null);
    try {
      const res = await hrApiFetch(
        `/api/v1/payroll/runs/${periodId}/partner-export`,
        {
          bearerToken,
          method: "POST",
          headers: { Accept: "application/json" },
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setActionMsg(
          body.error?.message === "payroll_partner_not_configured"
            ? "Configure payroll partner integration first (Settings → Integrations)."
            : "Partner export failed — ensure filing artifact exists.",
        );
        return;
      }
      const body = (await res.json()) as {
        data?: { export?: { exportId?: string; status?: string } };
      };
      setActionMsg(
        `Partner export ${body.data?.export?.status ?? "queued"} (ID ${body.data?.export?.exportId?.slice(0, 12) ?? "…"}).`,
      );
    } finally {
      setBusy(false);
    }
  };

  const runPayrollForPeriod = async () => {
    setBusy(true);
    setActionMsg(null);
    try {
      const res = await hrApiFetch("/api/v1/payroll/runs", {
        bearerToken,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payrollPeriodId: periodId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setActionMsg(
          body.error?.message === "payroll_period_locked"
            ? "This period is locked."
            : "Pay run failed.",
        );
        return;
      }
      setActionMsg("Pay run completed.");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const resolveException = async (
    id: string,
    status: "RESOLVED" | "WAIVED",
  ) => {
    setBusy(true);
    try {
      await hrApiFetch(`/api/v1/payroll/runs/exceptions/${id}`, {
        bearerToken,
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          resolutionNote: resolveNotes[id]?.trim() || "Reviewed in pay run console",
        }),
      });
      await reload();
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    startTransition(() => setDetail(undefined));
    void (async () => {
      await reload();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, bearerToken, periodId]);

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
        title="Pay period detail"
        description="Sign in to view payment instructions for this period."
        returnTo={`/hr/payroll-runs/${periodId}`}
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (detail === undefined) {
    return <p className="text-sm text-muted-foreground">Loading period…</p>;
  }

  if (!detail) {
    return (
      <p className="text-sm text-muted-foreground">
        Period not found or not accessible.{" "}
        <Link href="/hr/payroll-runs" className="text-primary underline">
          Back to runs
        </Link>
      </p>
    );
  }

  const downloadCsv = () => {
    const fingerprint = parseMemoFingerprint;
    const rows = detail.paymentInstructions.flatMap((pi) =>
      pi.lines.map((l) => ({
        employeeName: pi.employeeName,
        employeeId: pi.employeeId,
        lineType: l.lineType,
        amountMinor: l.amountMinor,
        currencyCode: l.currencyCode,
        inputsFingerprintSha256: fingerprint(pi.memo),
      })),
    );
    const csv = buildPeriodDetailCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-period-${detail.payrollPeriodId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openExceptions = exceptions.filter((e) => e.status === "OPEN");
  const step1Done =
    detail.status !== "OPEN" || detail.paymentInstructions.length > 0;
  const step2Done = detail.openExceptionCount === 0;
  const step3Done =
    detail.status === "LOCKED" || detail.status === "ARTIFACT_GENERATED";
  const step4Done = detail.status === "ARTIFACT_GENERATED";
  const stepsComplete = [step1Done, step2Done, step3Done, step4Done].filter(Boolean).length;
  const closeProgress = (stepsComplete / 4) * 100;

  return (
    <HrPageShell
      activePath="/hr/payroll-runs"
      onReload={() => void reload()}
      onSignOut={() => signOut()}
    >
      <HrPayrollPeriodSummary
        periodLabel={detail.label ?? "Pay period"}
        status={detail.status}
        employeeCount={detail.paymentInstructions.length}
        exceptionCount={detail.openExceptionCount}
      />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{detail.label ?? "Pay period"}</CardTitle>
            <PayrollPeriodStatusBadge status={detail.status} />
          </div>
          <CardDescription>
            {detail.startDate} → {detail.endDate}
            {detail.lockedAt ? ` · Locked ${detail.lockedAt.slice(0, 10)}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {actionMsg ? (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {actionMsg}
            </p>
          ) : null}

          <section aria-labelledby="close-checklist-heading">
            <h2 id="close-checklist-heading" className="text-sm font-semibold text-foreground">
              Period close checklist
            </h2>
            <Progress className="mt-3" value={closeProgress} aria-label="Close progress" />
            <p className="mt-1 text-xs text-muted-foreground">
              {stepsComplete} of 4 steps complete
            </p>
            <ol className="mt-3 space-y-4" role="list">
              <li className="list-none rounded-md border border-border p-4">
                <p className="text-sm font-medium">
                  {step1Done ? "✓" : "1."} Run payroll
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Compute payment instructions for all employees in this period.
                </p>
                {(detail.status === "OPEN" || detail.status === "COMPUTED") ? (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2"
                    disabled={busy}
                    onClick={() => void runPayrollForPeriod()}
                  >
                    Run payroll
                  </Button>
                ) : null}
              </li>
              <li className="list-none rounded-md border border-border p-4">
                <p className="text-sm font-medium">
                  {step2Done ? "✓" : "2."} Resolve exceptions
                </p>
                {openExceptions.length > 0 ? (
                  <ul className="mt-2 space-y-3" role="list">
                    {openExceptions.map((ex) => (
                      <li key={ex.id} className="list-none text-sm">
                        <p className="font-medium">{ex.employeeName}</p>
                        <p className="text-muted-foreground">
                          {payrollExceptionLabel(ex.code)}
                        </p>
                        <Textarea
                          placeholder="Resolution note (optional)"
                          className="mt-2 text-xs"
                          rows={2}
                          value={resolveNotes[ex.id] ?? ""}
                          onChange={(e) =>
                            setResolveNotes((prev) => ({
                              ...prev,
                              [ex.id]: e.target.value,
                            }))
                          }
                        />
                        <div className="mt-2 flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void resolveException(ex.id, "RESOLVED")}
                          >
                            Resolve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => void resolveException(ex.id, "WAIVED")}
                          >
                            Waive
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">No open exceptions.</p>
                )}
              </li>
              <li className="list-none rounded-md border border-border p-4">
                <p className="text-sm font-medium">{step3Done ? "✓" : "3."} Lock period</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Prevents further pay runs until counsel approves unlock.
                </p>
                {detail.status === "COMPUTED" ? (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2"
                    disabled={busy}
                    onClick={() => void lockPeriod()}
                  >
                    Lock period
                  </Button>
                ) : null}
              </li>
              <li className="list-none rounded-md border border-border p-4">
                <p className="text-sm font-medium">
                  {step4Done ? "✓" : "4."} Filing package
                </p>
                <Alert className="mt-2">
                  <AlertTitle>Not agency-submitted</AlertTitle>
                  <AlertDescription>
                    This JSON artifact is for counsel review and audit. It is not IRS e-file or
                    HMRC RTI transmission.
                  </AlertDescription>
                </Alert>
                {(detail.status === "LOCKED" || detail.status === "ARTIFACT_GENERATED") && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => void generateFiling()}
                    >
                      Generate filing package
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void downloadFilingJson()}
                    >
                      Download filing JSON
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void exportToPartner()}
                    >
                      Export to partner
                    </Button>
                  </div>
                )}
              </li>
            </ol>
          </section>

          {detail.paymentInstructions.length > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={downloadCsv}>
              Download audit CSV (with fingerprints)
            </Button>
          ) : null}

          {detail.paymentInstructions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payment instructions for this period yet.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border" role="list">
              {detail.paymentInstructions.map((pi) => {
                const cc = pi.lines[0]?.currencyCode ?? "USD";
                const net = netFromLines(pi.lines);
                return (
                  <li key={pi.paymentInstructionId} className="list-none px-4 py-3 text-sm">
                    <p className="font-medium text-foreground">{pi.employeeName}</p>
                    <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
                      Net: {formatMoneyMinor(net, cc)}
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground" role="list">
                      {pi.lines.map((l, i) => (
                        <li
                          key={`${l.lineType}-${l.sortOrder}-${i}`}
                          className="list-none flex justify-between gap-4"
                        >
                          <span>{l.lineType}</span>
                          <span className="tabular-nums">
                            {formatMoneyMinor(l.amountMinor, l.currencyCode)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {pi.memo ? (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          Technical detail
                        </summary>
                        <pre className="mt-1 max-h-24 overflow-auto rounded bg-muted p-2 text-[10px]">
                          {pi.memo}
                        </pre>
                      </details>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </HrPageShell>
  );
}
