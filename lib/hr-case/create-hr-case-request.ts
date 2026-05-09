import type { HrCaseCategory } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type HrCaseRequestPayload = {
  id: string;
  category: HrCaseCategory;
  status: string;
  createdAt: string;
};

export async function createMyHrCaseRequest(
  auth: AuthContext,
  input: { category: HrCaseCategory; body: string },
): Promise<HrCaseRequestPayload> {
  const employeeId = auth.subjectEmployeeId;
  if (!employeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  const body = input.body.trim().slice(0, 4000);
  if (body.length < 8) {
    throw new ApiError(400, {
      code: "bad_request",
      message: "case_body_too_short",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "case:intake_submit",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const scoped = await tx.employee.findFirst({
        where: { id: employeeId, tenantId: auth.tenantId },
        select: { id: true },
      });
      if (!scoped) {
        throw new ApiError(404, {
          code: "not_found",
          message: "employee_not_found",
        });
      }

      const row = await tx.hrCaseRequest.create({
        data: {
          tenantId: auth.tenantId,
          employeeId,
          category: input.category,
          body,
        },
      });

      return {
        id: row.id,
        category: row.category,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      };
    },
  );
}
