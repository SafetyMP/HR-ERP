"use client";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { MoneyLineSection, MoneyTotals } from "@/components/product/money-summary";
import { PageStateLoading } from "@/components/product/page-state";
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
    return <PageStateLoading label="Loading your earnings statement…" />;
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
    <div className="space-y-6">
      <MoneyTotals
        grossAmount={formatMoneyMinor(paystub.grossPayMinor, cc)}
        netAmount={formatMoneyMinor(paystub.netPayMinor, cc)}
      />

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b border-border bg-muted/20">
          <CardTitle className="text-xl">Current earnings statement</CardTitle>
          <CardDescription>
            Pay period {paystub.payPeriodStart} — {paystub.payPeriodEnd}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 p-6 lg:grid-cols-2">
          <MoneyLineSection
            title="Earnings"
            items={paystub.earnings.map((row, i) => ({
              key: `e-${i}-${row.lineType}`,
              label: row.label,
              amount: formatMoneyMinor(row.amountMinor, cc),
            }))}
          />
          <div className="space-y-8">
            <MoneyLineSection
              title="Pre-tax deductions"
              items={paystub.preTaxDeductions.map((row, i) => ({
                key: `p-${i}-${row.lineType}`,
                label: row.label,
                amount: formatMoneyMinor(row.amountMinor, cc),
              }))}
            />
            <MoneyLineSection
              title="Taxes"
              items={paystub.taxes.map((row, i) => ({
                key: `t-${i}-${row.lineType}`,
                label: row.label,
                amount: formatMoneyMinor(row.amountMinor, cc),
              }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
