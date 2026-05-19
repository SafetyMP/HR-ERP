"use client";

import { Button } from "@/components/ui/button";

/** Employee-safe copy — no stack traces, codes, or diagnostics (Feature 001 UAC 4). */
export default function PaystubErrorBoundary({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-8" role="alert">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          We couldn&apos;t load your earnings statement
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Something went wrong while opening this page. Try again in a moment. If pay should already be posted,
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
