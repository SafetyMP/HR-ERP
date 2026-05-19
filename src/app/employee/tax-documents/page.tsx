import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { TaxDocumentsClient } from "./tax-documents-client";

export const metadata: Metadata = {
  title: "Tax summaries",
  description: "Year-end tax document availability",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function TaxDocumentsPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/employee/tax-documents");

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Pay & taxes</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Tax summaries</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Understand what payroll has released for year-end artifacts before downloads arrive from your payroll vendor.
        </p>
      </header>
      <TaxDocumentsClient />
    </div>
  );
}
