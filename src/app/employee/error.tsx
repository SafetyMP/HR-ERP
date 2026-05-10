"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function EmployeeAreaError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error(JSON.stringify({ scope: "employee_area_error", message: error.message }));
  }, [error]);

  return (
    <main role="alert" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        We couldn’t load your workspace
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Your data is safe — this view just hit a snag. Try again, and reach out to HR if it
        keeps failing.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.assign("/")}
        >
          Back to home
        </Button>
      </div>
    </main>
  );
}
