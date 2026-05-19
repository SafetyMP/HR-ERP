import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { BenefitsLifeEventsClient } from "./benefits-life-events-client";

export const metadata: Metadata = {
  title: "Benefits life events",
  description: "Report a qualifying life event",
};

type Props = { searchParams?: Promise<{ devJwt?: string }> };

export default async function BenefitsLifeEventsPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee/benefits/life-events");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Benefits
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Life events</h1>
      </header>
      <BenefitsLifeEventsClient />
    </div>
  );
}
