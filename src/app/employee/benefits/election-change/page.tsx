import type { Metadata } from "next";

import { BenefitsElectionIntentClient } from "./benefits-election-intent-client";

export const metadata: Metadata = {
  title: "Benefits election intent",
  description: "Submit structured benefit change requests",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function BenefitsElectionIntentPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  const initialBearerToken =
    process.env.NODE_ENV === "development" && sp.devJwt?.trim() ? sp.devJwt.trim() : undefined;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Benefits</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">Election change intent</h1>
        <p className="mt-2 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
          Replace vague emails with a single intake note categorized by coverage area — fulfillment stays with Benefits Ops.
        </p>
      </header>
      <BenefitsElectionIntentClient initialBearerToken={initialBearerToken} />
    </div>
  );
}
