import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { runPayroll } from "@/lib/payroll/run-payroll";
import { prisma } from "@/lib/prisma";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

const RunPayrollBodySchema = z.object({
  payrollPeriodId: z.string().uuid(),
  employeeIds: z.array(z.string().uuid()).max(10_000).optional(),
  reissue: z.boolean().optional(),
});

export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname;

  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("POST", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "confidential");

    const json = await request.json().catch(() => null);
    const body = RunPayrollBodySchema.parse(json ?? {});

    const summary = await runPayroll(auth, {
      payrollPeriodId: body.payrollPeriodId,
      employeeIds: body.employeeIds,
      reissue: body.reissue ?? false,
    });

    return jsonV1(summary, auth.correlationId, { status: 201 });
  });
}

export async function GET(request: Request) {
  const pathname = new URL(request.url).pathname;

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

    const periods = await withAuthorizedTransaction(
      prisma,
      auth,
      {
        permission: policy.permission,
        abac: policy.abac,
        resourceClassification: "confidential",
      },
      async (tx) =>
        tx.payrollPeriod.findMany({
          where: { tenantId: auth.tenantId },
          orderBy: [{ endDate: "desc" }, { startDate: "desc" }],
          take: 100,
          select: {
            id: true,
            startDate: true,
            endDate: true,
            label: true,
            _count: { select: { paymentInstructions: true } },
          },
        }),
    );

    const data = periods.map((p) => ({
      payrollPeriodId: p.id,
      startDate: p.startDate.toISOString().slice(0, 10),
      endDate: p.endDate.toISOString().slice(0, 10),
      label: p.label,
      paymentInstructionCount: p._count.paymentInstructions,
    }));

    return jsonV1({ runs: data }, auth.correlationId);
  });
}
