import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { OrganizationContextClient } from "./organization-context-client";

export const metadata: Metadata = {
  title: "Organization",
  description: "Manager chain and peers snapshot",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function OrganizationPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee/organization");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Directory</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">Who&apos;s around me</h1>
        <p className="mt-2 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
          Lightweight structure so employees stop guessing who approves leave or owns headcount data for their team.
        </p>
      </header>
      <OrganizationContextClient />
    </div>
  );
}
