import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

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

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Benefits</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Your enrollments</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          A read-only summary of benefit elections on file. Changing coverage happens outside this screen during open
          enrollment or through your Benefits team.
        </p>
      </header>
      <BenefitsClient />
    </div>
  );
}
