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
import { formatMoneyMinor } from "@/lib/paystub/format-money";

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

type Detail = {
  payrollPeriodId: string;
  startDate: string;
  endDate: string;
  label: string | null;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{detail.label ?? "Pay period"}</CardTitle>
        <CardDescription>
          {detail.startDate} → {detail.endDate} · {detail.paymentInstructions.length} employees
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => void reload()}>
            Reload
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href="/hr/payroll-runs">All periods</Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>

        {detail.paymentInstructions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payment instructions for this period yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border" role="list">
            {detail.paymentInstructions.map((pi) => {
              const cc = pi.lines[0]?.currencyCode ?? "USD";
              const net = netFromLines(pi.lines);
              return (
                <li key={pi.paymentInstructionId} className="list-none px-4 py-3 text-sm">
                  <p className="font-medium text-foreground">{pi.employeeName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Net (approx. from lines): {formatMoneyMinor(net, cc)}
                    {pi.memo ? ` · ${pi.memo}` : ""}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground" role="list">
                    {pi.lines.map((l, i) => (
                      <li key={`${l.lineType}-${l.sortOrder}-${i}`} className="list-none flex justify-between gap-4">
                        <span>{l.lineType}</span>
                        <span className="tabular-nums">
                          {formatMoneyMinor(l.amountMinor, l.currencyCode)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
