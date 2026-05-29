"use client";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useHrAccess } from "@/lib/auth/use-hr-access";
import { formatMoneyMinor } from "@/lib/paystub/format-money";
import type { PaystubApiShape } from "@/lib/paystub/paystub-api-types";
import { useCurrentPaystubQuery } from "@/lib/paystub/use-current-paystub-query";

export type { PaystubApiLine, PaystubApiShape } from "@/lib/paystub/paystub-api-types";

type Props = {
  /** Used by Playwright / QA to inject a bearer token before hydration. */
  initialBearerToken?: string;
};

export function PaystubClient({ initialBearerToken }: Props) {
  const { ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const { data: paystub, isLoading, isError, error, refetch, isFetching } =
    useCurrentPaystubQuery();

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

  if (isError) {
    const recoverable =
      error instanceof Error &&
      !error.message.includes("401") &&
      !error.message.includes("unauthorized");
    if (recoverable) {
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
          <Button type="button" onClick={() => void refetch()} disabled={isFetching}>
            Retry
          </Button>
        </div>
      );
    }
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

  if (isLoading || paystub === undefined) {
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

  return <PaystubCard paystub={paystub} />;
}

function PaystubCard({ paystub }: { paystub: PaystubApiShape }) {
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

          <div className="border-t border-border pt-4">
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
