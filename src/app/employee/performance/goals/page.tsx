import type { Metadata } from "next";

import Link from "next/link";

import { GoalsDemoClient } from "@/features/performance/goals-demo-client";

export const metadata: Metadata = {
  title: "Performance goals",
  description: "View your performance goals for the active cycle",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function EmployeePerformanceGoalsPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  const initialBearerToken =
    process.env.NODE_ENV === "development" && sp.devJwt?.trim() ? sp.devJwt.trim() : undefined;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Performance</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">My goals</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Goals tied to your signed-in employee record. Full Phase 3 catalog lives on the{" "}
          <Link href="/demo/capabilities" className="font-medium text-primary underline underline-offset-4">
            capability hub
          </Link>
          .
        </p>
      </header>
      <GoalsDemoClient variant="employee" initialBearerToken={initialBearerToken} />
    </div>
  );
}
