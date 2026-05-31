import type { Metadata } from "next";
import { dehydrate } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { MeQueryHydrator } from "@/components/ess/me-query-hydrator";
import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";
import { prefetchEssHomePage } from "@/lib/ess/prefetch-me-reads";
import { getQueryClient } from "@/lib/query/get-query-client";

import { EmployeeHomeClient } from "./employee-home-client";

export const metadata: Metadata = {
  title: "Home",
  description: "Your pay, time, leave, and benefits in one place",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function EmployeeHomePage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee");

  const queryClient = getQueryClient();
  await prefetchEssHomePage(queryClient);

  return (
    <MeQueryHydrator state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Employee"
          title="Home"
          description="Pay, time off, benefits, and profile — one portal instead of juggling HRIS and payroll tools."
        />
        <EmployeeHomeClient />
      </div>
    </MeQueryHydrator>
  );
}
