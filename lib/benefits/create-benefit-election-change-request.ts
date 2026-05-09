import type { BenefitCategory } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type BenefitElectionIntentPayload = {
  id: string;
  category: BenefitCategory;
  summary: string;
  status: string;
  createdAt: string;
};

export async function createBenefitElectionChangeRequest(
  auth: AuthContext,
  input: { category: BenefitCategory; summary: string },
): Promise<BenefitElectionIntentPayload> {
  const employeeId = auth.subjectEmployeeId;
  if (!employeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  const summary = input.summary.trim().slice(0, 2000);
  if (summary.length < 8) {
    throw new ApiError(400, {
      code: "bad_request",
      message: "benefit_intent_too_short",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "benefits:election_intent_submit",
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

      const row = await tx.benefitElectionChangeRequest.create({
        data: {
          tenantId: auth.tenantId,
          employeeId,
          category: input.category,
          summary,
        },
      });

      return {
        id: row.id,
        category: row.category,
        summary: row.summary,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      };
    },
  );
}
