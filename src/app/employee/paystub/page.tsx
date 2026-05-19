import type { Metadata } from "next";

import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { PaystubClient } from "./paystub-client";

export const metadata: Metadata = {
  title: "Earnings statement",
  description: "View your current paystub",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function EmployeePaystubPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee/paystub");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Pay"
        title="Earnings statement"
        description={
          <>
            Your latest finalized paystub for this pay period. Need older periods?{" "}
            <Link href="/employee/paystub/history" className="font-medium text-primary underline">
              View pay history
            </Link>
            .
          </>
        }
      />
      <PaystubClient />
    </div>
  );
}
