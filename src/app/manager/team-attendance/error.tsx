"use client";

import { Button } from "@/components/ui/button";

export default function TeamAttendanceErrorBoundary({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-8" role="alert">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">We couldn&apos;t load Team attendance</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Something went wrong while opening today&apos;s snapshot. Try again or verify manager permissions if this persists.
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
