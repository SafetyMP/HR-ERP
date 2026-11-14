import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { HrDashboardClient } from "./hr-dashboard-client";

export const metadata: Metadata = {
  title: "HR overview",
  description: "HR operations summary",
};

type Props = { searchParams?: Promise<{ devJwt?: string }> };

export default async function HrDashboardPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/hr/dashboard");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="HR workspace"
        title="HR overview"
        description="Manage requests, keep payroll moving, and support your people."
      />
      <HrDashboardClient />
    </div>
  );
}
