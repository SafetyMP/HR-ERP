import type { Metadata } from "next";

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
  const initialBearerToken =
    process.env.NODE_ENV === "development" && sp.devJwt?.trim() ? sp.devJwt.trim() : undefined;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Time · Clock</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">Time</h1>
        <p className="mt-2 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
          Today’s attendance summary—confirm your latest punch time without opening a ticket.
        </p>
      </header>
      <TimeAttendanceClient initialBearerToken={initialBearerToken} />
    </div>
  );
}
