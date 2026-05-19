import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { prisma } from "@/lib/prisma";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export async function GET(
  request: Request,
  context: { params: Promise<{ periodId: string }> },
) {
  const pathname = new URL(request.url).pathname;
  const { periodId } = await context.params;

  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("GET", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "confidential");

    const rows = await withAuthorizedTransaction(
      prisma,
      auth,
      {
        permission: policy.permission,
        abac: policy.abac,
        resourceClassification: "confidential",
      },
      async (tx) => {
        const period = await tx.payrollPeriod.findFirst({
          where: { id: periodId, tenantId: auth.tenantId },
          select: { id: true },
        });
        if (!period) return null;

        return tx.payrollRunException.findMany({
          where: { payrollPeriodId: periodId, tenantId: auth.tenantId },
          include: {
            employee: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        });
      },
    );

    if (!rows) {
      throw new ApiError(404, {
        code: "not_found",
        message: "payroll_period_not_found",
      });
    }

    const data = rows.map((r) => ({
      id: r.id,
      payrollPeriodId: r.payrollPeriodId,
      employeeId: r.employeeId,
      employeeName:
        [r.employee.firstName, r.employee.lastName].filter(Boolean).join(" ") ||
        r.employeeId,
      code: r.code,
      status: r.status,
      resolutionNote: r.resolutionNote,
      createdAt: r.createdAt.toISOString(),
    }));

    return jsonV1({ exceptions: data }, auth.correlationId);
  });
}
