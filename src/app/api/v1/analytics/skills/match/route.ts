import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { prisma } from "@/lib/prisma";
import {
  buildRoleTargetVector,
  cosineSimilarity,
  parseEmbedding,
} from "@/lib/analytics/skills-match";
import { getRoutePolicy } from "@/lib/security/route-policies";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export async function GET(request: Request) {
  return safeRouteAuth(request, async (auth) => {
    const url = new URL(request.url);
    const targetRoleId = url.searchParams.get("targetRoleId")?.trim();
    if (!targetRoleId) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "targetRoleId query parameter required",
      });
    }

    const policy = getRoutePolicy("GET", "/api/v1/analytics/skills/match");
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }

    const matches = await withAuthorizedTransaction(
      prisma,
      auth,
      {
        permission: policy.permission,
        abac: policy.abac,
        resourceClassification: "confidential",
      },
      async (tx) => {
        const role = await tx.jobRole.findFirst({
          where: { id: targetRoleId, tenantId: auth.tenantId },
          include: {
            roleSkillTargets: {
              include: { skill: true },
            },
          },
        });
        if (!role) {
          throw new ApiError(404, {
            code: "not_found",
            message: "job_role_not_found",
          });
        }

        const targetParts: { embedding: number[]; importance: number }[] = [];
        let dim = 0;
        for (const rst of role.roleSkillTargets) {
          const embRows = await tx.employeeSkill.findMany({
            where: {
              skillId: rst.skillId,
              employee: { tenantId: auth.tenantId },
            },
            select: { embedding: true },
            take: 20,
          });
          const vectors = embRows
            .map((r) => parseEmbedding(r.embedding))
            .filter((v): v is number[] => v !== null && v.length > 0);
          if (vectors.length === 0) continue;
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
          targetParts.length > 0
            ? buildRoleTargetVector(targetParts, dim)
            : null;

        let effDim = dim;
        if (effDim === 0) {
          const anyEmb = await tx.employeeSkill.findFirst({
            where: { employee: { tenantId: auth.tenantId } },
            select: { embedding: true },
          });
          const p = parseEmbedding(anyEmb?.embedding ?? null);
          if (p) effDim = p.length;
        }

        const candidates = await tx.employee.findMany({
          where: {
            tenantId: auth.tenantId,
            status: "ACTIVE",
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            employeeSkills: {
              select: { embedding: true, skillId: true, proficiency: true },
            },
          },
          take: 500,
        });

        const ranked = candidates
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
            const score =
              agg && targetVec && effDim > 0
                ? cosineSimilarity(agg, targetVec)
                : 0; // coverage gap → low score
            return {
              employeeId: emp.id,
              email: emp.email,
              name: [emp.firstName, emp.lastName].filter(Boolean).join(" "),
              matchScore: score,
              skillsWithEmbeddings: embs.length,
            };
          })
          .filter((r) => r.skillsWithEmbeddings > 0 || targetVec === null)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 25);

        return {
          targetRole: {
            id: role.id,
            title: role.title,
            canonicalTitle: role.canonicalTitle,
          },
          rankedInternalCandidates: ranked,
        };
      },
    );

    return jsonV1(matches, auth.correlationId);
  });
}
