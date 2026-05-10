import { ApiError } from "@/lib/api/v1/errors";
import {
  mapPaymentInstructionToCurrentPaystub,
  type CurrentPaystubPayload,
  type PaystubLinePayload,
} from "@/lib/paystub/map-payment-instruction-row";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type { CurrentPaystubPayload, PaystubLinePayload };

/**
 * Reads the latest persisted PaymentInstruction for the calling employee. Rows are written
 * by `lib/payroll/run-payroll.ts` (POST `/api/v1/payroll/runs`), which invokes the
 * deterministic kernel in `packages/payroll-calc` and stores the resulting earnings,
 * pre-tax deductions, and tax withholdings as PayoutLines.
 */
export async function getCurrentPaystub(
  auth: AuthContext,
): Promise<CurrentPaystubPayload | null> {
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
      const row = await tx.paymentInstruction.findFirst({
        where: {
          tenantId: auth.tenantId,
          employeeId,
          payrollPeriodId: { not: null },
        },
        orderBy: [
          { payrollPeriod: { endDate: "desc" } },
          { updatedAt: "desc" },
        ],
        include: {
          payrollPeriod: true,
          lines: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
          employee: {
            select: {
              organization: { select: { reportingCurrency: true } },
            },
          },
        },
      });

      if (!row) {
        return null;
      }

      return mapPaymentInstructionToCurrentPaystub(row);
    },
  );
}
