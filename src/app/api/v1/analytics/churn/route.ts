import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { prisma } from "@/lib/prisma";
import { getRoutePolicy } from "@/lib/security/route-policies";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export async function GET(request: Request) {
  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("GET", "/api/v1/analytics/churn");
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }

    const scores = await withAuthorizedTransaction(
      prisma,
      auth,
      {
        permission: policy.permission,
        abac: policy.abac,
        resourceClassification: "confidential",
      },
      async (tx) => {
        const raw = await tx.churnScore.findMany({
          where: { tenantId: auth.tenantId },
          orderBy: [{ scoredAt: "desc" }],
          take: 400,
          include: {
            employee: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                jobRole: { select: { title: true, canonicalTitle: true } },
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
          if (out.length >= 100) break;
        }
        return out;
      },
    );

    return jsonV1({ churnScores: scores }, auth.correlationId);
  });
}
