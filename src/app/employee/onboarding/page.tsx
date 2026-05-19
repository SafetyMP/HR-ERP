import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { OnboardingTasksClient } from "./onboarding-client";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "New hire onboarding checklist",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function EmployeeOnboardingPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee/onboarding");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Getting started</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Onboarding</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Track what&apos;s done and what&apos;s still open during your first weeks—without digging through email threads.
        </p>
      </header>
      <OnboardingTasksClient />
    </div>
  );
}
