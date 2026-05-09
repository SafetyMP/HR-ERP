import type { Metadata } from "next";

import { JurisdictionFieldsDemo } from "@/features/example-jurisdiction/jurisdiction-form";

export const metadata: Metadata = {
  title: "Jurisdiction demo | HR ERP",
  description: "API-driven payroll intake fields with accessible validation.",
};

export default function JurisdictionExamplePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Dynamic payroll fields</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Demonstrates instant UI reactions to backend field catalogs (no client-side tax math).
        </p>
      </div>
      <JurisdictionFieldsDemo />
    </main>
  );
}
