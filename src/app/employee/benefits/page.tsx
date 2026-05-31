import type { Metadata } from "next";
import { dehydrate } from "@tanstack/react-query";

import { MeQueryHydrator } from "@/components/ess/me-query-hydrator";
import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";
import { prefetchEssBenefitsPage } from "@/lib/ess/prefetch-me-reads";
import { getQueryClient } from "@/lib/query/get-query-client";

import { BenefitsClient } from "./benefits-client";

export const metadata: Metadata = {
  title: "Benefits",
  description: "View your current benefit enrollments",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function EmployeeBenefitsPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee/benefits");

  const queryClient = getQueryClient();
  await prefetchEssBenefitsPage(queryClient);

  return (
    <MeQueryHydrator state={dehydrate(queryClient)}>
      <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Benefits</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Your enrollments</h1>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            Your current elections on file. To request a change during open enrollment or after a qualifying event, use
            Request election change — your Benefits team reviews in-app.
          </p>
        </header>
        <BenefitsClient />
      </div>
    </MeQueryHydrator>
  );
}
