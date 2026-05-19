import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { PtoClient } from "./pto-client";

import { TimeOffRequestsPanel } from "./time-off-requests-panel";

export const metadata: Metadata = {
  title: "PTO",
  description: "View your PTO balance and recorded time off",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function EmployeePtoPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee/pto");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Time off</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Your PTO</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Your balance and recorded dates are informational. Submit multi-day time-off requests below—approvals still follow your
          employer&apos;s normal HR/manager process.
        </p>
      </header>
      <PtoClient />
      <TimeOffRequestsPanel />
    </div>
  );
}
