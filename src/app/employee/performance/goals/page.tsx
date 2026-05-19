import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { PerformanceGoalsClient } from "@/features/performance/performance-goals-client";

export const metadata: Metadata = {
  title: "Performance goals",
  description: "View your performance goals for the active cycle",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function EmployeePerformanceGoalsPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee/performance/goals");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Performance</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Performance goals</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          View and add goals for the open performance cycle on your record.
        </p>
      </header>
      <PerformanceGoalsClient variant="employee" />
    </div>
  );
}
