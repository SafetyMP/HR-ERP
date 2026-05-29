import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
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
    <div className="flex min-h-[60vh] flex-col gap-8">
      <PageHeader
        eyebrow="Time off"
        title="Your PTO"
        description="Your balance and recorded dates are informational. Submit multi-day time-off requests below—approvals still follow your employer's normal HR/manager process."
      />
      <PtoClient />
      <TimeOffRequestsPanel />
    </div>
  );
}
