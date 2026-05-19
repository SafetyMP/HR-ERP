import type {
  PayrollRunExceptionCode,
  PayrollRunExceptionStatus,
  Prisma,
} from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import type { RunPayrollEmployeeResult } from "@/lib/payroll/run-payroll";

function codeFromResult(status: RunPayrollEmployeeResult["status"]): PayrollRunExceptionCode | null {
  if (status === "no_compensation") return "NO_COMPENSATION";
  if (status === "skipped_existing") return "SKIPPED_EXISTING";
  return null;
}

export async function syncExceptionsFromRunResults(
  tx: Prisma.TransactionClient,
  tenantId: string,
  payrollPeriodId: string,
  results: readonly RunPayrollEmployeeResult[],
): Promise<void> {
  for (const row of results) {
    const code = codeFromResult(row.status);
    if (!code) continue;

    await tx.payrollRunException.upsert({
      where: {
        tenantId_payrollPeriodId_employeeId_code: {
          tenantId,
          payrollPeriodId,
          employeeId: row.employeeId,
          code,
        },
      },
      create: {
        tenantId,
        payrollPeriodId,
        employeeId: row.employeeId,
        code,
        status: "OPEN",
      },
      update: {
        status: "OPEN",
        resolutionNote: null,
      },
    });
  }
}

export async function resolvePayrollException(
  tx: Prisma.TransactionClient,
  tenantId: string,
  exceptionId: string,
  input: {
    status: Extract<PayrollRunExceptionStatus, "RESOLVED" | "WAIVED">;
    resolutionNote?: string;
  },
) {
  const row = await tx.payrollRunException.findFirst({
    where: { id: exceptionId, tenantId },
  });
  if (!row) {
    throw new ApiError(404, {
      code: "not_found",
      message: "payroll_exception_not_found",
    });
  }
  if (row.status !== "OPEN") {
    throw new ApiError(409, {
      code: "conflict",
      message: "payroll_exception_already_closed",
    });
  }

  return tx.payrollRunException.update({
    where: { id: row.id },
    data: {
      status: input.status,
      resolutionNote: input.resolutionNote?.trim().slice(0, 2000) ?? null,
    },
  });
}
