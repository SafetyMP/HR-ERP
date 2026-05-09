"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-8" role="alert">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">This view hit a snag</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          The HR ERP chrome stayed online. Try again — if something still feels off, share the diagnostics below with
          support so they can pair it with logs.
        </p>
      </div>
      {process.env.NODE_ENV === "development" ? (
        <pre className="overflow-x-auto rounded-md bg-zinc-100 p-4 text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
          {error.message}
        </pre>
      ) : null}
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
