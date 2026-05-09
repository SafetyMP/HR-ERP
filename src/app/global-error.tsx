"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body className="min-h-screen bg-white p-8 text-zinc-900">
        <main className="mx-auto max-w-lg space-y-4" role="alert">
          <h1 className="text-2xl font-semibold">Application error</h1>
          <p className="text-sm text-zinc-600">
            A global failure occurred. Reloading usually restores the shell. If not, contact IT with the time of the
            incident.
          </p>
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            onClick={() => reset()}
          >
            Reload experience
          </button>
        </main>
      </body>
    </html>
  );
}
