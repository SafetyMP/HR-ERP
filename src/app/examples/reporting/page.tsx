import type { Metadata } from "next";

import { CompensationBandsExplorer } from "@/features/reporting/compensation-bands-explorer";
import { sampleSalaryBands } from "@/features/reporting/salary-sample-data";

export const metadata: Metadata = {
  title: "Comp bands | HR ERP",
  description: "Interactive table and chart from mock compensation JSON.",
};

export default function ReportingExamplePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Compensation insights</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          TanStack Table handles sortable grids; Recharts visualizes the same dataset for leadership reviews.
        </p>
      </div>
      <CompensationBandsExplorer rows={sampleSalaryBands} />
    </main>
  );
}
