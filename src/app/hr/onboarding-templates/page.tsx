import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { HrOnboardingTemplatesClient } from "./hr-onboarding-templates-client";

export const metadata: Metadata = {
  title: "Onboarding templates",
  description: "Assign HR onboarding checklist packs",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function HrOnboardingTemplatesPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/hr/onboarding-templates");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">HR Operations</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">Onboarding templates</h1>
        <p className="mt-2 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
          Clone curated checklist rows onto employees without rewriting tasks manually for each hire cohort.
        </p>
      </header>
      <HrOnboardingTemplatesClient />
    </div>
  );
}
