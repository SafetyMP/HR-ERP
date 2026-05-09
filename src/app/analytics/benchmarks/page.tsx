import Link from "next/link";

import {
  demoHrAdminAuth,
  isAnalyticsDemoMode,
  requireDemoTenantId,
} from "@/lib/analytics/demo-auth";
import { prisma } from "@/lib/prisma";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export const dynamic = "force-dynamic";

const codeBox =
  "rounded-md bg-zinc-200 px-1.5 py-0.5 text-[13px] font-mono text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100";

const linkClass =
  "font-semibold text-primary underline decoration-2 underline-offset-[5px] hover:brightness-125 dark:hover:brightness-125";

export default async function BenchmarksPage() {
  if (!isAnalyticsDemoMode()) {
    return (
      <div className="mx-auto max-w-3xl p-8 font-sans">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Compensation benchmarks
        </h1>
        <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
          Enable <code className={codeBox}>ANALYTICS_DEMO_MODE=1</code> and{" "}
          <code className={codeBox}>DEMO_TENANT_ID</code>.
        </p>
        <p className="mt-4">
          <Link href="/" className={linkClass}>
            Home
          </Link>
        </p>
      </div>
    );
  }

  let tenantId: string;
  try {
    tenantId = requireDemoTenantId();
  } catch {
    return (
      <div className="mx-auto max-w-3xl p-8 font-sans">
        <p className="text-zinc-700 dark:text-zinc-300">Set DEMO_TENANT_ID in .env.</p>
        <Link href="/" className={`mt-4 inline-block ${linkClass}`}>
          Home
        </Link>
      </div>
    );
  }

  const data = await loadBenchmarks(tenantId);

  return (
    <div className="mx-auto max-w-5xl p-8 font-sans text-zinc-900 dark:text-zinc-50">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Market benchmarks</h1>
        <Link href="/" className={`text-sm ${linkClass}`}>
          Home
        </Link>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">Latest snapshots</h2>
      <div className="mb-8 overflow-x-auto rounded-lg border border-zinc-300 bg-card shadow-sm dark:border-zinc-600 dark:bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-100 text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-200">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Geo</th>
              <th className="px-4 py-3">p50</th>
              <th className="px-4 py-3">p75</th>
              <th className="px-4 py-3">Provider</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-600">
            {data.benchmarks.map((b) => (
              <tr key={b.id} className="bg-white dark:bg-zinc-900/40">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  {b.jobRole?.canonicalTitle ?? b.jobRole?.title ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{b.geoCode}</td>
                <td className="px-4 py-3 font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                  {b.p50Annual?.toString() ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                  {b.p75Annual?.toString() ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{b.provider}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">Open alerts</h2>
      <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
        {data.alerts.map((a) => (
          <li key={a.id}>
            <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{a.severity}</span> — {a.message}
          </li>
        ))}
      </ul>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-950 dark:text-zinc-50">Title normalization</h2>
      <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
        {data.maps.map((m) => (
          <li key={m.id}>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">{m.internalTitleKey}</span> →{" "}
            {m.normalizedTitle} ({m.geoCode})
          </li>
        ))}
      </ul>
    </div>
  );
}

async function loadBenchmarks(tenantId: string) {
  const auth = demoHrAdminAuth(tenantId);
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "analytics:benchmarks:read",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
      resourceClassification: "confidential",
    },
    async (tx) => {
      const benchmarks = await tx.marketBenchmark.findMany({
        where: { tenantId },
        orderBy: { effectiveDate: "desc" },
        take: 40,
        include: {
          jobRole: {
            select: { title: true, canonicalTitle: true },
          },
        },
      });
      const alerts = await tx.benchmarkAlert.findMany({
        where: { tenantId, clearedAt: null },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      const maps = await tx.jobTitleMap.findMany({
        where: { tenantId },
        take: 30,
      });
      return { benchmarks, alerts, maps };
    },
  );
}
