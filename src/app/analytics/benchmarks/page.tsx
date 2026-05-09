import Link from "next/link";

import {
  demoHrAdminAuth,
  isAnalyticsDemoMode,
  requireDemoTenantId,
} from "@/lib/analytics/demo-auth";
import { prisma } from "@/lib/prisma";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export const dynamic = "force-dynamic";

export default async function BenchmarksPage() {
  if (!isAnalyticsDemoMode()) {
    return (
      <div className="mx-auto max-w-3xl p-8 font-sans">
        <h1 className="text-2xl font-semibold">Compensation benchmarks</h1>
        <p className="mt-4 text-zinc-600">
          Enable{" "}
          <code className="rounded bg-zinc-100 px-1">ANALYTICS_DEMO_MODE=1</code> and{" "}
          <code className="rounded bg-zinc-100 px-1">DEMO_TENANT_ID</code>.
        </p>
        <p className="mt-4">
          <Link href="/" className="text-blue-600 underline">
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
      <div className="mx-auto max-w-3xl p-8">
        <p>Set DEMO_TENANT_ID in .env.</p>
        <Link href="/" className="text-blue-600 underline">
          Home
        </Link>
      </div>
    );
  }

  const data = await loadBenchmarks(tenantId);

  return (
    <div className="mx-auto max-w-5xl p-8 font-sans text-zinc-900">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Market benchmarks</h1>
        <Link href="/" className="text-sm text-blue-600 underline">
          Home
        </Link>
      </div>

      <h2 className="mb-2 text-lg font-medium">Latest snapshots</h2>
      <div className="mb-8 overflow-x-auto rounded-lg border border-zinc-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Geo</th>
              <th className="px-3 py-2">p50</th>
              <th className="px-3 py-2">p75</th>
              <th className="px-3 py-2">Provider</th>
            </tr>
          </thead>
          <tbody>
            {data.benchmarks.map((b) => (
              <tr key={b.id} className="border-t border-zinc-100">
                <td className="px-3 py-2">
                  {b.jobRole?.canonicalTitle ?? b.jobRole?.title ?? "—"}
                </td>
                <td className="px-3 py-2">{b.geoCode}</td>
                <td className="px-3 py-2 font-mono">
                  {b.p50Annual?.toString() ?? "—"}
                </td>
                <td className="px-3 py-2 font-mono">
                  {b.p75Annual?.toString() ?? "—"}
                </td>
                <td className="px-3 py-2">{b.provider}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 text-lg font-medium">Open alerts</h2>
      <ul className="list-inside list-disc text-sm text-zinc-700">
        {data.alerts.map((a) => (
          <li key={a.id}>
            <span className="font-mono text-xs">{a.severity}</span> — {a.message}
          </li>
        ))}
      </ul>

      <h2 className="mb-2 mt-8 text-lg font-medium">Title normalization</h2>
      <ul className="list-inside list-disc text-sm text-zinc-700">
        {data.maps.map((m) => (
          <li key={m.id}>
            <span className="font-mono">{m.internalTitleKey}</span> →{" "}
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
