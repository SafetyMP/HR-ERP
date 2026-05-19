import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { PerformanceGoalsClient } from "@/features/performance/performance-goals-client";

import { ManagerTeamReviewsClient } from "./manager-team-reviews-client";

export const metadata: Metadata = {
  title: "Team performance goals",
  description: "View performance goals for direct reports",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function ManagerTeamPerformancePage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/manager/team-performance");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Manager</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Team performance goals</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          View and add goals for direct reports during an open performance cycle.
        </p>
      </header>
      <PerformanceGoalsClient variant="manager" />
      <ManagerTeamReviewsClient />
    </div>
  );
}
