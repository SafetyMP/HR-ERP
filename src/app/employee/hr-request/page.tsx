import type { Metadata } from "next";

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
  const initialBearerToken =
    process.env.NODE_ENV === "development" && sp.devJwt?.trim() ? sp.devJwt.trim() : undefined;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Help</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">HR & payroll requests</h1>
        <p className="mt-2 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
          Send a structured note to HR Operations. Follow up through your usual channels if you need a faster response.
        </p>
      </header>
      <HrCaseRequestClient initialBearerToken={initialBearerToken} />
    </div>
  );
}
