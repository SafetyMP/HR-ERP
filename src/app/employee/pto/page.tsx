import type { Metadata } from "next";
import { dehydrate } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { MeQueryHydrator } from "@/components/ess/me-query-hydrator";
import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";
import { prefetchEssPtoPage } from "@/lib/ess/prefetch-me-reads";
import { getQueryClient } from "@/lib/query/get-query-client";

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

  const queryClient = getQueryClient();
  await prefetchEssPtoPage(queryClient);

  return (
    <MeQueryHydrator state={dehydrate(queryClient)}>
      <div className="flex min-h-[60vh] flex-col gap-8">
      <PageHeader
        eyebrow="Time off"
        title="Your PTO"
        description="Your balance and recorded dates are informational. Submit multi-day time-off requests below—approvals still follow your employer's normal HR/manager process."
      />
      <PtoClient />
      <TimeOffRequestsPanel />
      </div>
    </MeQueryHydrator>
  );
}
