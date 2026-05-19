import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { EmployeeReviewsClient } from "./employee-reviews-client";

export const metadata: Metadata = {
  title: "My performance review",
  description: "Self review for the open cycle",
};

type Props = { searchParams?: Promise<{ devJwt?: string }> };

export default async function EmployeePerformanceReviewsPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee/performance/reviews");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold text-foreground">My review</h1>
      </header>
      <EmployeeReviewsClient />
    </div>
  );
}
