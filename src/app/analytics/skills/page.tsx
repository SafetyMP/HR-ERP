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

const codeBox =
  "rounded-md bg-zinc-200 px-1.5 py-0.5 text-[13px] font-mono text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100";

const linkClass =
  "font-semibold text-primary underline decoration-2 underline-offset-[5px] hover:brightness-125 dark:hover:brightness-125";

export default async function SkillsMatchPage({
  searchParams,
}: {
  searchParams: Promise<{ targetRoleId?: string }>;
}) {
  if (!isAnalyticsDemoMode()) {
    return (
      <div className="mx-auto max-w-3xl p-8 font-sans">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Internal mobility (skills)
        </h1>
        <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
          Enable <code className={codeBox}>ANALYTICS_DEMO_MODE=1</code> and{" "}
          <code className={codeBox}>DEMO_TENANT_ID</code> for this demo UI.
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

  const sp = await searchParams;
  const roleId =
    sp.targetRoleId?.trim() ?? process.env.DEMO_TARGET_ROLE_ID?.trim() ?? "";

  if (!roleId) {
    return (
      <div className="mx-auto max-w-3xl p-8 font-sans">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Skills match</h1>
        <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
          Add <code className={codeBox}>?targetRoleId=</code> (a <code className={codeBox}>job_roles.id</code>) or set{" "}
          <code className={codeBox}>DEMO_TARGET_ROLE_ID</code> in .env.
        </p>
        <p className="mt-4">
          <Link href="/" className={linkClass}>
            Home
          </Link>
        </p>
      </div>
    );
  }

  const ranked = await rankInternalCandidates(tenantId, roleId);

  return (
    <div className="mx-auto max-w-5xl p-8 font-sans text-zinc-900 dark:text-zinc-50">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Internal candidates</h1>
        <Link href="/" className={`text-sm ${linkClass}`}>
          Home
        </Link>
      </div>
      <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">
        Target role: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{ranked.roleTitle}</span>
      </p>
      <div className="overflow-x-auto rounded-lg border border-zinc-300 bg-card shadow-sm dark:border-zinc-600 dark:bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-100 text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-200">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Match</th>
              <th className="px-4 py-3">Skill vectors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-600">
            {ranked.rows.map((r) => (
              <tr key={r.employeeId} className="bg-white dark:bg-zinc-900/40">
                <td className="px-4 py-3 font-medium">
                  {r.name}{" "}
                  <span className="font-normal text-zinc-600 dark:text-zinc-400">({r.email})</span>
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">{r.matchScore.toFixed(3)}</td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{r.skillsWithEmbeddings}</td>
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
