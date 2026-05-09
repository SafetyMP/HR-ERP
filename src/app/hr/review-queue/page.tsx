import type { Metadata } from "next";

import { HrReviewQueueClient } from "./hr-review-queue-client";

export const metadata: Metadata = {
  title: "HR review queue",
  description: "Triage HR cases and attendance corrections",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function HrReviewQueuePage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  const initialBearerToken =
    process.env.NODE_ENV === "development" && sp.devJwt?.trim() ? sp.devJwt.trim() : undefined;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">HR Operations</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">Review queue</h1>
        <p className="mt-2 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
          Lightweight triage surfaces — not a full HRIS case management replacement.
        </p>
      </header>
      <HrReviewQueueClient initialBearerToken={initialBearerToken} />
    </div>
  );
}
