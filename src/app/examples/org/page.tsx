import type { Metadata } from "next";

import { OrgChartTree } from "@/features/org/org-chart-tree";
import { sampleOrgTree } from "@/features/org/sample-org-data";

export const metadata: Metadata = {
  title: "Org explorer | HR ERP",
  description: "Accessible hierarchy view rendered from JSON tree data.",
};

export default function OrgExamplePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Organization hierarchy</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Nested disclosures keep focus management predictable for keyboard and screen-reader users.
        </p>
      </div>
      <OrgChartTree root={sampleOrgTree} />
    </main>
  );
}
