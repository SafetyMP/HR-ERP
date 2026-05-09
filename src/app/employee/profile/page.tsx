import type { Metadata } from "next";

import { EmployeeProfileClient } from "./profile-client";

export const metadata: Metadata = {
  title: "My profile",
  description: "Review and update your HR profile and contact details",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function EmployeeProfilePage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  const initialBearerToken =
    process.env.NODE_ENV === "development" && sp.devJwt?.trim() ? sp.devJwt.trim() : undefined;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Core HR</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">My profile</h1>
        <p className="mt-2 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
          Review what HR has on file and update the fields your policy allows. Sensitive identifiers are never shown in
          full here.
        </p>
      </header>
      <EmployeeProfileClient initialBearerToken={initialBearerToken} />
    </div>
  );
}
