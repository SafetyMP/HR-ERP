"use client";

import {
  clearDevBearerTokenFromSession,
  readDevBearerTokenFromSession,
  writeDevBearerTokenToSession,
} from "@/lib/auth/dev-bearer-session";

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

async function fetchPaystubHistory(token: string): Promise<{
  rows: PaystubHistoryRow[] | null;
  ok: boolean;
  auth: boolean;
}> {
  const res = await fetch("/api/v1/me/paystub/history", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
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
  const [token, setTokenState] = useState<string | null>(null);
  const [rows, setRows] = useState<PaystubHistoryRow[] | undefined>(undefined);
  const [loadError, setLoadError] = useState<"auth" | "recoverable" | null>(null);

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

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    startTransition(() => {
      setLoadError(null);
      setRows(undefined);
    });

    void (async () => {
      const result = await fetchPaystubHistory(token);
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
  }, [token]);

  const retryLoad = () => {
    if (!token) return;
    startTransition(() => {
      setLoadError(null);
      setRows(undefined);
    });
    void (async () => {
      const result = await fetchPaystubHistory(token);
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

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paste token</CardTitle>
          <CardDescription>Sign in with your development bearer token to load pay history.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loadError === "recoverable") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">We couldn&apos;t load pay history.</p>
        <Button type="button" onClick={() => retryLoad()}>
          Retry
        </Button>
      </div>
    );
  }

  if (loadError === "auth") {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Session issue — sign in again.</p>;
  }

  if (rows === undefined) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading pay history…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
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
                    <div className="text-xs uppercase tracking-wide text-zinc-500">Gross</div>
                    <div className="tabular-nums font-medium">{formatMoneyMinor(row.grossPayMinor, row.currencyCode)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">Net</div>
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
