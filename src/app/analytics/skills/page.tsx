import Link from "next/link";

import {
  buildRoleTargetVector,
  cosineSimilarity,
  parseEmbedding,
} from "@/lib/analytics/skills-match";
import {
  demoHrAdminAuth,
  isAnalyticsDemoMode,
  requireDemoTenantId,
} from "@/lib/analytics/demo-auth";
import { prisma } from "@/lib/prisma";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export const dynamic = "force-dynamic";

export default async function SkillsMatchPage({
  searchParams,
}: {
  searchParams: Promise<{ targetRoleId?: string }>;
}) {
  if (!isAnalyticsDemoMode()) {
    return (
      <div className="mx-auto max-w-3xl p-8 font-sans">
        <h1 className="text-2xl font-semibold">Internal mobility (skills)</h1>
        <p className="mt-4 text-zinc-600">
          Enable{" "}
          <code className="rounded bg-zinc-100 px-1">ANALYTICS_DEMO_MODE=1</code> and{" "}
          <code className="rounded bg-zinc-100 px-1">DEMO_TENANT_ID</code> for this demo UI.
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

  const sp = await searchParams;
  const roleId =
    sp.targetRoleId?.trim() ?? process.env.DEMO_TARGET_ROLE_ID?.trim() ?? "";

  if (!roleId) {
    return (
      <div className="mx-auto max-w-3xl p-8 font-sans">
        <h1 className="text-2xl font-semibold">Skills match</h1>
        <p className="mt-4 text-zinc-600">
          Add <code className="rounded bg-zinc-100 px-1">?targetRoleId=</code> (a{" "}
          <code className="rounded bg-zinc-100 px-1">job_roles.id</code>) or set{" "}
          <code className="rounded bg-zinc-100 px-1">DEMO_TARGET_ROLE_ID</code> in
          .env.
        </p>
        <p className="mt-4">
          <Link href="/" className="text-blue-600 underline">
            Home
          </Link>
        </p>
      </div>
    );
  }

  const ranked = await rankInternalCandidates(tenantId, roleId);

  return (
    <div className="mx-auto max-w-5xl p-8 font-sans text-zinc-900">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Internal candidates</h1>
        <Link href="/" className="text-sm text-blue-600 underline">
          Home
        </Link>
      </div>
      <p className="mb-2 text-sm text-zinc-600">
        Target role: <span className="font-medium">{ranked.roleTitle}</span>
      </p>
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2">Employee</th>
              <th className="px-3 py-2">Match</th>
              <th className="px-3 py-2">Skill vectors</th>
            </tr>
          </thead>
          <tbody>
            {ranked.rows.map((r) => (
              <tr key={r.employeeId} className="border-t border-zinc-100">
                <td className="px-3 py-2">
                  {r.name} <span className="text-zinc-500">({r.email})</span>
                </td>
                <td className="px-3 py-2 font-mono">
                  {r.matchScore.toFixed(3)}
                </td>
                <td className="px-3 py-2">{r.skillsWithEmbeddings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function rankInternalCandidates(tenantId: string, targetRoleId: string) {
  const auth = demoHrAdminAuth(tenantId);
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "analytics:skills:read",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
      resourceClassification: "confidential",
    },
    async (tx) => {
      const role = await tx.jobRole.findFirst({
        where: { id: targetRoleId, tenantId },
        include: { roleSkillTargets: true },
      });
      if (!role) {
        return { roleTitle: "Not found", rows: [] };
      }

      const targetParts: { embedding: number[]; importance: number }[] = [];
      let dim = 0;
      for (const rst of role.roleSkillTargets) {
        const embRows = await tx.employeeSkill.findMany({
          where: { skillId: rst.skillId, employee: { tenantId } },
          select: { embedding: true },
          take: 20,
        });
        const vectors = embRows
          .map((r) => parseEmbedding(r.embedding))
          .filter((v): v is number[] => v !== null && v.length > 0);
        if (!vectors.length) continue;
        dim = vectors[0].length;
        const avg = new Array(dim).fill(0);
        for (const v of vectors) {
          if (v.length !== dim) continue;
          for (let i = 0; i < dim; i++) avg[i] += v[i];
        }
        for (let i = 0; i < dim; i++) avg[i] /= vectors.length;
        targetParts.push({ embedding: avg, importance: rst.importance });
      }

      const targetVec =
        targetParts.length > 0 ? buildRoleTargetVector(targetParts, dim) : null;

      let effDim = dim;
      if (effDim === 0) {
        const anyEmb = await tx.employeeSkill.findFirst({
          where: { employee: { tenantId } },
          select: { embedding: true },
        });
        const p = parseEmbedding(anyEmb?.embedding ?? null);
        if (p) effDim = p.length;
      }

      const candidates = await tx.employee.findMany({
        where: { tenantId, status: "ACTIVE" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          employeeSkills: { select: { embedding: true } },
        },
        take: 500,
      });

      const rows = candidates
        .map((emp) => {
          const embs = emp.employeeSkills
            .map((es) => parseEmbedding(es.embedding))
            .filter((e): e is number[] => e !== null && e.length === effDim);
          const agg =
            embs.length > 0
              ? buildRoleTargetVector(
                  embs.map((embedding) => ({ embedding, importance: 1 })),
                  effDim,
                )
              : null;
          const matchScore =
            agg && targetVec && effDim > 0
              ? cosineSimilarity(agg, targetVec)
              : 0;
          return {
            employeeId: emp.id,
            email: emp.email,
            name: [emp.firstName, emp.lastName].filter(Boolean).join(" "),
            matchScore,
            skillsWithEmbeddings: embs.length,
          };
        })
        .filter((r) => r.skillsWithEmbeddings > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 25);

      return { roleTitle: role.title, rows };
    },
  );
}
