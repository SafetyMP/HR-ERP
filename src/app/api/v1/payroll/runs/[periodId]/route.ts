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

    const detail = await withAuthorizedTransaction(
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
          include: {
            paymentInstructions: {
              include: {
                lines: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
                employee: { select: { id: true, firstName: true, lastName: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        });
        if (!period) return null;

        return {
          payrollPeriodId: period.id,
          startDate: period.startDate.toISOString().slice(0, 10),
          endDate: period.endDate.toISOString().slice(0, 10),
          label: period.label,
          paymentInstructions: period.paymentInstructions.map((pi) => ({
            paymentInstructionId: pi.id,
            employeeId: pi.employeeId,
            employeeName: [pi.employee.firstName, pi.employee.lastName]
              .filter(Boolean)
              .join(" ") || pi.employeeId,
            memo: pi.memo,
            lines: pi.lines.map((l) => ({
              lineType: l.lineType,
              sortOrder: l.sortOrder,
              amountMinor: l.amountMinor,
              currencyCode: l.currencyCode,
            })),
          })),
        };
      },
    );

    if (!detail) {
      throw new ApiError(404, {
        code: "not_found",
        message: "payroll_period_not_found",
      });
    }

    return jsonV1(detail, auth.correlationId);
  });
}
