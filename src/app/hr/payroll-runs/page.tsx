import type { Metadata } from "next";

import Link from "next/link";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { HrPayrollRunsClient } from "./hr-payroll-runs-client";

export const metadata: Metadata = {
  title: "Payroll runs",
  description: "List pay periods and execute payroll",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function HrPayrollRunsPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/hr/payroll-runs");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Payroll operations
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Pay run console</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Execute gross-to-net for a period and review payment instructions.{" "}
          <Link href="/" className="font-medium text-primary underline underline-offset-4">
            Back to home
          </Link>
          .
        </p>
      </header>
      <HrPayrollRunsClient />
    </div>
  );
}
