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


export type PaystubHistoryRow = {
  paymentInstructionId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  currencyCode: string;
  grossPayMinor: number;
  netPayMinor: number;
};

type Props = {
  initialBearerToken?: string;
};

function formatRange(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
  return `${fmt.format(new Date(`${start}T12:00:00.000Z`))} — ${fmt.format(new Date(`${end}T12:00:00.000Z`))}`;
}

async function fetchPaystubHistory(bearerToken: string | null): Promise<{
  rows: PaystubHistoryRow[] | null;
  ok: boolean;
  auth: boolean;
}> {
  const res = await hrApiFetch("/api/v1/me/paystub/history", {
    bearerToken,
    headers: { Accept: "application/json" },
  });
  if (res.status === 401) {
    return { rows: null, ok: false, auth: true };
  }
  if (!res.ok) {
    return { rows: null, ok: false, auth: false };
  }
  const body = (await res.json()) as { data?: { paystubHistory?: PaystubHistoryRow[] } };
  return { rows: body.data?.paystubHistory ?? [], ok: true, auth: false };
}

export function PaystubHistoryClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const [rows, setRows] = useState<PaystubHistoryRow[] | undefined>(undefined);
  const [loadError, setLoadError] = useState<"auth" | "recoverable" | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    startTransition(() => {
      setLoadError(null);
      setRows(undefined);
    });

    void (async () => {
      const result = await fetchPaystubHistory(bearerToken);
      if (cancelled) return;
      if (!result.ok && result.auth) {
        setLoadError("auth");
        setRows([]);
        return;
      }
      if (!result.ok) {
        setLoadError("recoverable");
        setRows([]);
        return;
      }
      setRows(result.rows ?? []);
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
      setRows(undefined);
    });
    void (async () => {
      const result = await fetchPaystubHistory(bearerToken);
      if (!result.ok && result.auth) {
        setLoadError("auth");
        setRows([]);
        return;
      }
      if (!result.ok) {
        setLoadError("recoverable");
        setRows([]);
        return;
      }
      setRows(result.rows ?? []);
      setLoadError(null);
    })();
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
        title="Pay history"
        description="Sign in to view your historical earnings statements."
        returnTo="/employee/paystub/history"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (loadError === "recoverable") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">We couldn&apos;t load pay history.</p>
        <Button type="button" onClick={() => retryLoad()}>
          Retry
        </Button>
      </div>
    );
  }

  if (loadError === "auth") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Session issue — sign in again.</p>
        <Button type="button" variant="outline" onClick={() => signOut()}>
          Sign out and start over
        </Button>
      </div>
    );
  }

  if (rows === undefined) {
    return <p className="text-sm text-muted-foreground">Loading pay history…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Corrected pay runs appear as separate rows when payroll posts them — contact HR if something looks wrong.
      </p>
      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No historical pay periods yet</CardTitle>
            <CardDescription>
              Once payroll posts additional finalized periods, they&apos;ll show here with gross and net summaries.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-3" role="list">
          {rows.map((row) => (
            <li key={row.paymentInstructionId}>
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{formatRange(row.payPeriodStart, row.payPeriodEnd)}</CardTitle>
                  <CardDescription>Pay period</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Gross</div>
                    <div className="tabular-nums font-medium">{formatMoneyMinor(row.grossPayMinor, row.currencyCode)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Net</div>
                    <div className="tabular-nums font-medium">{formatMoneyMinor(row.netPayMinor, row.currencyCode)}</div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <Button asChild variant="outline">
        <Link href="/employee/paystub">Back to current earnings statement</Link>
      </Button>
    </div>
  );
}
