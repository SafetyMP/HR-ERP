import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { prismaRead } from "@/lib/prisma";
import { getRoutePolicy } from "@/lib/security/route-policies";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export async function GET(request: Request) {
  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("GET", "/api/v1/analytics/benchmarks");
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }

    const payload = await withAuthorizedTransaction(
      prismaRead,
      auth,
      {
        permission: policy.permission,
        abac: policy.abac,
        resourceClassification: "confidential",
      },
      async (tx) => {
        const benchmarks = await tx.marketBenchmark.findMany({
          where: { tenantId: auth.tenantId },
          orderBy: { effectiveDate: "desc" },
          take: 80,
          include: {
            jobRole: {
              select: {
                id: true,
                title: true,
                canonicalTitle: true,
              },
            },
          },
        });
        const alerts = await tx.benchmarkAlert.findMany({
          where: { tenantId: auth.tenantId, clearedAt: null },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            jobRole: { select: { id: true, title: true } },
          },
        });
        const titleMaps = await tx.jobTitleMap.findMany({
          where: { tenantId: auth.tenantId },
          take: 50,
        });
        return { benchmarks, alerts, titleMaps };
      },
    );

    return jsonV1(
      {
        benchmarks: payload.benchmarks.map((b) => ({
          ...b,
          p50Annual: b.p50Annual != null ? Number(b.p50Annual) : null,
          p75Annual: b.p75Annual != null ? Number(b.p75Annual) : null,
          p90Annual: b.p90Annual != null ? Number(b.p90Annual) : null,
        })),
        alerts: payload.alerts,
        titleMaps: payload.titleMaps,
      },
      auth.correlationId,
    );
  });
}
