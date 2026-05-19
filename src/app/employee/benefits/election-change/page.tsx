import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

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
  redirectDevJwtToSession(sp.devJwt, "/employee/benefits/election-change");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Benefits</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Election change intent</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Replace vague emails with a single intake note categorized by coverage area — fulfillment stays with Benefits Ops.
        </p>
      </header>
      <BenefitsElectionIntentClient />
    </div>
  );
}
