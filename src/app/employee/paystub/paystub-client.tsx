"use client";

import { startTransition, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoneyMinor } from "@/lib/paystub/format-money";

const STORAGE_KEY = "hrerp_bearer_token";

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

async function fetchPaystub(token: string): Promise<{
  paystub: PaystubApiShape | null;
  ok: boolean;
  retryable: boolean;
}> {
  const res = await fetch("/api/v1/me/paystub/current", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
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
  const [token, setTokenState] = useState<string | null>(null);
  const [paystub, setPaystub] = useState<PaystubApiShape | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<"auth" | "recoverable" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    startTransition(() => {
      const fromStorage = sessionStorage.getItem(STORAGE_KEY)?.trim();
      if (fromStorage) {
        setTokenState(fromStorage);
      } else if (initialBearerToken?.trim()) {
        sessionStorage.setItem(STORAGE_KEY, initialBearerToken.trim());
        setTokenState(initialBearerToken.trim());
      }
    });
  }, [initialBearerToken]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    startTransition(() => {
      setLoadError(null);
      setPaystub(undefined);
    });

    void (async () => {
      const result = await fetchPaystub(token);
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
  }, [token]);

  const retryLoad = useCallback(() => {
    if (!token) return;
    startTransition(() => {
      setLoadError(null);
      setPaystub(undefined);
    });
    void (async () => {
      const result = await fetchPaystub(token);
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
  }, [token]);

  const devHint =
    process.env.NODE_ENV === "development" ? (
      <p className="mt-4 rounded-md border border-dashed border-zinc-300 p-3 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        Dev only: issue a JWT with{" "}
        <code className="font-mono">roles=[&quot;employee&quot;]</code> and{" "}
        <code className="font-mono">subject_employee_id</code> set to your seeded employee id, then paste it below.
        Example:{" "}
        <code className="font-mono">
          DEV_ROLES=employee DEV_SUBJECT_EMPLOYEE_ID=… DEV_TENANT_ID=… node scripts/issue-dev-jwt.mjs
        </code>
      </p>
    ) : null;

  if (!token) {
    return (
      <Card className="mx-auto w-full max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle>Earnings statement</CardTitle>
          <CardDescription>
            Sign in to view your paystub. Your session token was not found on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="hrerp-token">
            Paste bearer token (development)
          </label>
          <textarea
            id="hrerp-token"
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
            rows={3}
            placeholder="Bearer token from scripts/issue-dev-jwt.mjs"
            onChange={(e) => {
              const v = e.target.value.trim();
              if (v && typeof window !== "undefined") {
                sessionStorage.setItem(STORAGE_KEY, v);
                setTokenState(v);
              }
            }}
          />
          {devHint}
        </CardContent>
      </Card>
    );
  }

  if (loadError === "recoverable") {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4">
        <div role="alert">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            We couldn&apos;t load your earnings statement
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
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
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Session issue</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Your session could not be verified. Sign in again and return to your earnings statement.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            sessionStorage.removeItem(STORAGE_KEY);
            setTokenState(null);
            setLoadError(null);
            setPaystub(undefined);
          }}
        >
          Clear token and start over
        </Button>
      </div>
    );
  }

  if (paystub === undefined) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
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
            <h3 id="earnings-heading" className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Earnings
            </h3>
            <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
              {paystub.earnings.map((row, i) => (
                <li key={`e-${i}-${row.lineType}`} className="flex justify-between py-2 text-sm">
                  <span>{row.label}</span>
                  <span className="tabular-nums">{formatMoneyMinor(row.amountMinor, cc)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="pretax-heading">
            <h3 id="pretax-heading" className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Pre-tax deductions
            </h3>
            {paystub.preTaxDeductions.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">None this period.</p>
            ) : (
              <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
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
            <h3 id="taxes-heading" className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Taxes
            </h3>
            {paystub.taxes.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">None this period.</p>
            ) : (
              <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
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
