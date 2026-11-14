import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { EmployeeHomeClient } from "./employee-home-client";

export const metadata: Metadata = {
  title: "Employee home",
  description: "Your pay, time off, benefits, and HR support in one place",
};

type Props = { searchParams?: Promise<{ devJwt?: string }> };

export default async function EmployeeHomePage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee");

  // Let the existing authenticated queries load each summary independently.
  // Home navigation must not wait for all four server-side data reads.
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Employee workspace"
        title="Your workday, made simpler"
        description="Find what you need for your pay, time, and life at work."
      />
      <EmployeeHomeClient />
    </div>
  );
}
