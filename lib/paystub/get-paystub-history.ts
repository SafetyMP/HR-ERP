import { ApiError } from "@/lib/api/v1/errors";
import {
  mapPaymentInstructionToSummary,
  type PaystubHistorySummaryPayload,
} from "@/lib/paystub/map-payment-instruction-row";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type { PaystubHistorySummaryPayload };

export async function getPaystubHistory(
  auth: AuthContext,
): Promise<PaystubHistorySummaryPayload[]> {
  const employeeId = auth.subjectEmployeeId;
  if (!employeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "paystub:read",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const rows = await tx.paymentInstruction.findMany({
        where: {
          tenantId: auth.tenantId,
          employeeId,
          payrollPeriodId: { not: null },
        },
        orderBy: [{ payrollPeriod: { endDate: "desc" } }, { updatedAt: "desc" }],
        take: 36,
        include: {
          payrollPeriod: true,
          lines: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
          organization: { select: { reportingCurrency: true } },
        },
      });

      const out: PaystubHistorySummaryPayload[] = [];
      for (const row of rows) {
        const summary = mapPaymentInstructionToSummary(row);
        if (summary) out.push(summary);
      }
      return out;
    },
  );
}
