import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { resolvePayrollException } from "@/lib/payroll/payroll-exceptions";
import { prisma } from "@/lib/prisma";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

const PatchSchema = z.object({
  status: z.enum(["RESOLVED", "WAIVED"]),
  resolutionNote: z.string().max(2000).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const pathname = new URL(request.url).pathname;
  const { id } = await context.params;

  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("PATCH", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "confidential");

    const body = PatchSchema.parse(await request.json().catch(() => ({})));

    const updated = await withAuthorizedTransaction(
      prisma,
      auth,
      {
        permission: policy.permission,
        abac: policy.abac,
        resourceClassification: "confidential",
        prismaTx: { isolationLevel: "Serializable" },
      },
      async (tx) =>
        resolvePayrollException(tx, auth.tenantId, id, {
          status: body.status,
          resolutionNote: body.resolutionNote,
        }),
    );

    return jsonV1(
      {
        id: updated.id,
        status: updated.status,
        resolutionNote: updated.resolutionNote,
      },
      auth.correlationId,
    );
  });
}
