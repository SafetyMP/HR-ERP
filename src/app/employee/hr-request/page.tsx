import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { HrCaseRequestClient } from "./hr-case-client";

export const metadata: Metadata = {
  title: "Contact HR",
  description: "Submit an HR or payroll intake note",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function EmployeeHrRequestPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee/hr-request");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Help</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">HR & payroll requests</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Send a structured note to HR Operations. Follow up through your usual channels if you need a faster response.
        </p>
      </header>
      <HrCaseRequestClient />
    </div>
  );
}
