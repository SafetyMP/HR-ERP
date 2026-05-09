import Link from "next/link";

import {
  demoHrAdminAuth,
  isAnalyticsDemoMode,
  requireDemoTenantId,
} from "@/lib/analytics/demo-auth";
import { prisma } from "@/lib/prisma";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export const dynamic = "force-dynamic";

export default async function ChurnAnalyticsPage() {
  if (!isAnalyticsDemoMode()) {
    return (
      <div className="mx-auto max-w-3xl p-8 font-sans">
        <h1 className="text-2xl font-semibold">Flight risk (churn)</h1>
        <p className="mt-4 text-zinc-600">
          Enable local demo dashboards with{" "}
          <code className="rounded bg-zinc-100 px-1">ANALYTICS_DEMO_MODE=1</code> and{" "}
          <code className="rounded bg-zinc-100 px-1">DEMO_TENANT_ID</code> in{" "}
          <code className="rounded bg-zinc-100 px-1">.env</code> (development only).
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
      <div className="mx-auto max-w-3xl p-8 font-sans">
        <p>
          Set <code className="rounded bg-zinc-100 px-1">DEMO_TENANT_ID</code> in{" "}
          <code className="rounded bg-zinc-100 px-1">.env</code> after running{" "}
          <code className="rounded bg-zinc-100 px-1">npm run db:seed:predictive</code>.
        </p>
        <p className="mt-4">
          <Link href="/" className="text-blue-600 underline">
            Home
          </Link>
        </p>
      </div>
    );
  }

  const scores = await loadScores(tenantId);

  return (
    <div className="mx-auto max-w-5xl p-8 font-sans text-zinc-900">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Flight risk scores</h1>
        <Link href="/" className="text-sm text-blue-600 underline">
          Home
        </Link>
      </div>
      <p className="mb-6 text-sm text-zinc-600">
        Latest stored scores per employee (batch scoring via{" "}
        <code className="rounded bg-zinc-100 px-1">churn_scores</code>).
      </p>
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2">Employee</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Model</th>
              <th className="px-3 py-2">Drivers</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((row) => (
              <tr key={row.id} className="border-t border-zinc-100">
                <td className="px-3 py-2">
                  {[row.employee.firstName, row.employee.lastName]
                    .filter(Boolean)
                    .join(" ") || row.employee.email}
                </td>
                <td className="px-3 py-2">
                  {row.employee.jobRole?.title ?? "—"}
                </td>
                <td className="px-3 py-2 font-mono">{row.score.toFixed(2)}</td>
                <td className="px-3 py-2 text-zinc-600">{row.modelVersion}</td>
                <td className="px-3 py-2 text-xs text-zinc-600">
                  {JSON.stringify(row.drivers)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function loadScores(tenantId: string) {
  const auth = demoHrAdminAuth(tenantId);
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "analytics:churn:read",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
      resourceClassification: "confidential",
    },
    async (tx) => {
      const raw = await tx.churnScore.findMany({
        where: { tenantId },
        orderBy: { scoredAt: "desc" },
        take: 200,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              jobRole: { select: { title: true } },
            },
          },
        },
      });
      const seen = new Set<string>();
      const out: typeof raw = [];
      for (const row of raw) {
        if (seen.has(row.employeeId)) continue;
        seen.add(row.employeeId);
        out.push(row);
      }
      return out;
    },
  );
}
