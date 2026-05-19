import type { Metadata } from "next";

import Link from "next/link";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { HrPayrollPeriodClient } from "./hr-payroll-period-client";

export const metadata: Metadata = {
  title: "Pay period detail",
  description: "Payment instructions for a payroll period",
};

type Props = {
  params: Promise<{ periodId: string }>;
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function HrPayrollPeriodPage(props: Props) {
  const { periodId } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, `/hr/payroll-runs/${periodId}`);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Payroll operations
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Period detail</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          <Link href="/hr/payroll-runs" className="font-medium text-primary underline underline-offset-4">
            ← Pay runs
          </Link>
        </p>
      </header>
      <HrPayrollPeriodClient periodId={periodId} />
    </div>
  );
}
