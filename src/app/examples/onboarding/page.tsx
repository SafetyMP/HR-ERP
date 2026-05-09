import type { Metadata } from "next";

import { OnboardingWizardDemo } from "@/features/onboarding/onboarding-wizard-demo";

export const metadata: Metadata = {
  title: "Onboarding wizard | HR ERP",
  description: "Client-side wizard state separate from server truth.",
};

export default function OnboardingExamplePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Onboarding wizard</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Zustand coordinates multi-step flows; React Query remains the system of record once APIs are wired.
        </p>
      </div>
      <OnboardingWizardDemo />
    </main>
  );
}
