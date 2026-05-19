import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { HrDashboardClient } from "./hr-dashboard-client";

export const metadata: Metadata = {
  title: "HR dashboard",
  description: "HR operations summary",
};

type Props = { searchParams?: Promise<{ devJwt?: string }> };

export default async function HrDashboardPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/hr/dashboard");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="HR operations"
        title="Dashboard"
        description="Headcount, payroll exceptions, and queues that need your attention."
      />
      <HrDashboardClient />
    </div>
  );
}
