"use client";

import { Button } from "@/components/ui/button";

export default function TimeAttendanceErrorBoundary({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-8" role="alert">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          We couldn’t load Time
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Something went wrong while opening this page. Try again in a moment. If your punches still look wrong,
          contact Payroll.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="outline" onClick={() => window.location.assign("/")}>
          Return home
        </Button>
      </div>
    </main>
  );
}
