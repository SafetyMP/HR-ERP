"use client";

import { startTransition, useCallback, useEffect, useState } from "react";

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

export type PaystubApiLine = {
  label: string;
  amountMinor: number;
  lineType: string;
};

export type PaystubApiShape = {
  paymentInstructionId?: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  currencyCode: string;
  grossPayMinor: number;
  netPayMinor: number;
  earnings: PaystubApiLine[];
  preTaxDeductions: PaystubApiLine[];
  taxes: PaystubApiLine[];
};

type Props = {
  /** Used by Playwright / QA to inject a bearer token before hydration. */
  initialBearerToken?: string;
};

async function fetchPaystub(
  bearerToken: string | null,
): Promise<{
  paystub: PaystubApiShape | null;
  ok: boolean;
  retryable: boolean;
}> {
  const res = await hrApiFetch("/api/v1/me/paystub/current", {
    bearerToken,
    headers: { Accept: "application/json" },
  });

  if (res.status === 401) {
    return { paystub: null, ok: false, retryable: false };
  }

  const body = (await res.json()) as {
    data?: { paystub: PaystubApiShape | null };
    error?: { code?: string; message?: string };
  };

  if (!res.ok) {
    const retryable = res.status >= 500;
    return { paystub: null, ok: false, retryable };
  }

  return {
    paystub: body.data?.paystub ?? null,
    ok: true,
    retryable: false,
  };
}

export function PaystubClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const [paystub, setPaystub] = useState<PaystubApiShape | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<"auth" | "recoverable" | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    startTransition(() => {
      setLoadError(null);
      setPaystub(undefined);
    });

    void (async () => {
      const result = await fetchPaystub(bearerToken);
      if (cancelled) return;
      if (!result.ok && !result.retryable) {
        setLoadError("auth");
        setPaystub(null);
        return;
      }
      if (!result.ok) {
        setLoadError("recoverable");
        setPaystub(null);
        return;
      }
      setPaystub(result.paystub);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, bearerToken]);

  const retryLoad = useCallback(() => {
    if (!isAuthenticated) return;
    startTransition(() => {
      setLoadError(null);
      setPaystub(undefined);
    });
    void (async () => {
      const result = await fetchPaystub(bearerToken);
      if (!result.ok && !result.retryable) {
        setLoadError("auth");
        setPaystub(null);
        return;
      }
      if (!result.ok) {
        setLoadError("recoverable");
        setPaystub(null);
        return;
      }
      setPaystub(result.paystub);
    })();
  }, [isAuthenticated, bearerToken]);

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
        title="Earnings statement"
        description="Sign in to view your paystub."
        returnTo="/employee/paystub"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (loadError === "recoverable") {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4">
        <div role="alert">
          <h2 className="text-lg font-semibold text-foreground">
            We couldn&apos;t load your earnings statement
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please try again in a moment. If this keeps happening, contact Payroll.
          </p>
        </div>
        <Button type="button" onClick={() => retryLoad()}>
          Retry
        </Button>
      </div>
    );
  }

  if (loadError === "auth") {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4">
        <div role="alert">
          <h2 className="text-lg font-semibold text-foreground">Session issue</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your session could not be verified. Sign in again and return to your earnings statement.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => signOut()}>
          Sign out and start over
        </Button>
      </div>
    );
  }

  if (paystub === undefined) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading your earnings statement…
      </p>
    );
  }

  if (paystub === null) {
    return (
      <Card className="mx-auto w-full max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle>No paystub yet</CardTitle>
          <CardDescription>
            There isn&apos;t an earnings statement available for you yet. If you recently joined or this is a new pay
            period, check back after Payroll posts pay. If you expected pay already, contact Payroll.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const cc = paystub.currencyCode;

  return (
    <div className="space-y-8">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Current earnings statement</CardTitle>
          <CardDescription>
            Pay period {paystub.payPeriodStart} — {paystub.payPeriodEnd}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section aria-labelledby="earnings-heading">
            <h3 id="earnings-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Earnings
            </h3>
            <ul className="mt-3 divide-y divide-border">
              {paystub.earnings.map((row, i) => (
                <li key={`e-${i}-${row.lineType}`} className="flex justify-between py-2 text-sm">
                  <span>{row.label}</span>
                  <span className="tabular-nums">{formatMoneyMinor(row.amountMinor, cc)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="pretax-heading">
            <h3 id="pretax-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Pre-tax deductions
            </h3>
            {paystub.preTaxDeductions.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">None this period.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {paystub.preTaxDeductions.map((row, i) => (
                  <li key={`p-${i}-${row.lineType}`} className="flex justify-between py-2 text-sm">
                    <span>{row.label}</span>
                    <span className="tabular-nums">{formatMoneyMinor(row.amountMinor, cc)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="taxes-heading">
            <h3 id="taxes-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Taxes
            </h3>
            {paystub.taxes.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">None this period.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {paystub.taxes.map((row, i) => (
                  <li key={`t-${i}-${row.lineType}`} className="flex justify-between py-2 text-sm">
                    <span>{row.label}</span>
                    <span className="tabular-nums">{formatMoneyMinor(row.amountMinor, cc)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div className="flex justify-between text-sm font-medium">
              <span>Gross pay</span>
              <span className="tabular-nums">{formatMoneyMinor(paystub.grossPayMinor, cc)}</span>
            </div>
            <div className="mt-3 flex justify-between text-base font-semibold">
              <span>Net pay</span>
              <span className="tabular-nums">{formatMoneyMinor(paystub.netPayMinor, cc)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
