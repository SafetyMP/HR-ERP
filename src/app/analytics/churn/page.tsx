import Link from "next/link";

import {
  demoHrAdminAuth,
  isAnalyticsDemoMode,
  requireDemoTenantId,
} from "@/lib/analytics/demo-auth";
import { prisma } from "@/lib/prisma";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

import { ChurnDistributionChart } from "./churn-distribution-chart";

export const dynamic = "force-dynamic";

const codeBox =
  "rounded-md bg-zinc-200 px-1.5 py-0.5 text-[13px] font-mono text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100";

const linkClass =
  "font-semibold text-primary underline decoration-2 underline-offset-[5px] hover:brightness-125 dark:hover:brightness-125";

export default async function ChurnAnalyticsPage() {
  if (!isAnalyticsDemoMode()) {
    return (
      <div className="mx-auto max-w-3xl p-8 font-sans">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Flight risk (churn)
        </h1>
        <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
          Enable local demo dashboards with <code className={codeBox}>ANALYTICS_DEMO_MODE=1</code> and{" "}
          <code className={codeBox}>DEMO_TENANT_ID</code> in <code className={codeBox}>.env</code>{" "}
          (development only).
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
        <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
          Set <code className={codeBox}>DEMO_TENANT_ID</code> in <code className={codeBox}>.env</code> after
          running <code className={codeBox}>npm run db:seed:predictive</code>.
        </p>
        <p className="mt-4">
          <Link href="/" className={linkClass}>
            Home
          </Link>
        </p>
      </div>
    );
  }

  const scores = await loadScores(tenantId);

  return (
    <div className="mx-auto max-w-5xl p-8 font-sans text-zinc-900 dark:text-zinc-50">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Flight risk scores</h1>
        <Link href="/" className={`text-sm ${linkClass}`}>
          Home
        </Link>
      </div>
      <p className="mb-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        Latest stored scores per employee (batch scoring via <code className={codeBox}>churn_scores</code>).
      </p>
      <div className="mb-6">
        <ChurnDistributionChart rows={scores.map((s) => ({ score: s.score }))} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-300 bg-card shadow-sm dark:border-zinc-600 dark:bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-100 text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-200">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Drivers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-600">
            {scores.map((row) => (
              <tr key={row.id} className="bg-white dark:bg-zinc-900/40">
                <td className="px-4 py-3 font-medium">
                  {[row.employee.firstName, row.employee.lastName].filter(Boolean).join(" ") ||
                    row.employee.email}
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  {row.employee.jobRole?.title ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">{row.score.toFixed(2)}</td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{row.modelVersion}</td>
                <td className="px-4 py-3 font-mono text-xs leading-snug text-zinc-600 dark:text-zinc-400">
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
