import type { PayoutLineType } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { computePaystubTotals } from "@/lib/paystub/totals";
import { payoutLineTypeLabel } from "@/lib/paystub/line-labels";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type PaystubLinePayload = {
  label: string;
  amountMinor: number;
  lineType: PayoutLineType;
};

export type CurrentPaystubPayload = {
  payPeriodStart: string;
  payPeriodEnd: string;
  currencyCode: string;
  grossPayMinor: number;
  netPayMinor: number;
  earnings: PaystubLinePayload[];
  preTaxDeductions: PaystubLinePayload[];
  taxes: PaystubLinePayload[];
};

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

      if (!row?.payrollPeriod) {
        return null;
      }

      const currencyCode =
        row.lines.find((l) => l.currencyCode)?.currencyCode ??
        row.employee.organization.reportingCurrency ??
        "USD";

      const totals = computePaystubTotals(
        row.lines.map((l) => ({
          lineType: l.lineType,
          amountMinor: l.amountMinor,
        })),
      );

      const earnings: PaystubLinePayload[] = [];
      const preTaxDeductions: PaystubLinePayload[] = [];
      const taxes: PaystubLinePayload[] = [];

      for (const line of row.lines) {
        const amountMinor = line.amountMinor ?? 0;
        const label = payoutLineTypeLabel(line.lineType);
        const payload: PaystubLinePayload = {
          label,
          amountMinor,
          lineType: line.lineType,
        };

        if (
          line.lineType === "SALARY" ||
          line.lineType === "BONUS" ||
          line.lineType === "EXPENSE_REIMBURSEMENT"
        ) {
          earnings.push(payload);
        } else if (line.lineType === "PRE_TAX_DEDUCTION") {
          preTaxDeductions.push(payload);
        } else if (line.lineType === "TAX_WITHHOLDING") {
          taxes.push(payload);
        }
      }

      return {
        payPeriodStart: row.payrollPeriod.startDate.toISOString().slice(0, 10),
        payPeriodEnd: row.payrollPeriod.endDate.toISOString().slice(0, 10),
        currencyCode,
        grossPayMinor: totals.grossPayMinor,
        netPayMinor: totals.netPayMinor,
        earnings,
        preTaxDeductions,
        taxes,
      };
    },
  );
}
