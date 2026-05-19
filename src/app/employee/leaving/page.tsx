import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { SeparationTasksClient } from "./separation-tasks-client";

export const metadata: Metadata = {
  title: "Leaving checklist",
  description: "Separation tasks for departing employees",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function EmployeeLeavingPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee/leaving");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Transitions</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Leaving checklist</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Mirrors onboarding ergonomics for respectful exits — compliance-sensitive approvals remain with HR & payroll teams.
        </p>
      </header>
      <SeparationTasksClient />
    </div>
  );
}
