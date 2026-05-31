import type { Metadata } from "next";
import { dehydrate } from "@tanstack/react-query";

import { MeQueryHydrator } from "@/components/ess/me-query-hydrator";
import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";
import { prefetchEssTimePage } from "@/lib/ess/prefetch-me-reads";
import { getQueryClient } from "@/lib/query/get-query-client";

import { TimeAttendanceClient } from "./time-attendance-client";

export const metadata: Metadata = {
  title: "Time — Clock",
  description: "Today’s attendance summary and clock-in",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function EmployeeTimePage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee/time");

  const queryClient = getQueryClient();
  await prefetchEssTimePage(queryClient);

  return (
    <MeQueryHydrator state={dehydrate(queryClient)}>
      <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Time · Clock</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Time</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Today’s attendance summary—confirm your latest punch time without opening a ticket.
        </p>
      </header>
      <TimeAttendanceClient />
      </div>
    </MeQueryHydrator>
  );
}
