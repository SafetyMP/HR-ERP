import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

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
  redirectDevJwtToSession(sp.devJwt, "/employee/profile");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Core HR</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">My profile</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Review what HR has on file and update the fields your policy allows. Sensitive identifiers are never shown in
          full here.
        </p>
      </header>
      <EmployeeProfileClient />
    </div>
  );
}
