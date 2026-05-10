import type { Metadata } from "next";

import Link from "next/link";

import { GoalsDemoClient } from "@/features/performance/goals-demo-client";

export const metadata: Metadata = {
  title: "Team performance goals",
  description: "View performance goals for direct reports",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function ManagerTeamPerformancePage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  const initialBearerToken =
    process.env.NODE_ENV === "development" && sp.devJwt?.trim() ? sp.devJwt.trim() : undefined;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Manager</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Team performance goals</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Lists goals for employees who report to your manager record in Core HR. Need hierarchy context? Open{" "}
          <Link href="/employee/organization" className="font-medium text-primary underline underline-offset-4">
            Organization context
          </Link>{" "}
          as an employee demo.
        </p>
      </header>
      <GoalsDemoClient variant="manager" initialBearerToken={initialBearerToken} />
    </div>
  );
}
