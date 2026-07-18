import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import type {
  CoreHrEmployeeRead,
  EmployeePayRunFact,
  PayrollDb,
} from "@/lib/payroll/ports";

export const monolithCoreHrEmployeeRead: CoreHrEmployeeRead = {
  async getEmployeeFact(tenantId, employeeId) {
    const row = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      select: { id: true, tenantId: true, email: true, status: true },
    });
    if (!row) return null;
    return {
      employeeId: row.id,
      tenantId: row.tenantId,
      email: row.email,
      status: row.status,
    };
  },

  async listEmployeesForPayRun(tx, args) {
    const employeeWhere: Prisma.EmployeeWhereInput = {
      tenantId: args.tenantId,
      ...(args.employeeIds?.length
        ? { id: { in: [...args.employeeIds] } }
        : {}),
    };
    const employees = await tx.employee.findMany({
      where: employeeWhere,
      include: {
        organization: {
          select: {
            jurisdictionCountry: true,
            jurisdictionSubdivision: true,
          },
        },
        compensationRecords: {
          where: { effectiveFrom: { lte: args.compensationEffectiveOnOrBefore } },
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
      },
    });

    return employees.map((employee): EmployeePayRunFact => {
      const latest = employee.compensationRecords[0];
      return {
        employeeId: employee.id,
        tenantId: employee.tenantId,
        email: employee.email,
        status: employee.status,
        jurisdictionCountry: employee.organization.jurisdictionCountry,
        jurisdictionSubdivision: employee.organization.jurisdictionSubdivision,
        compensation: latest
          ? {
              baseAmount: latest.baseAmount,
              currency: latest.currency,
              effectiveFrom: latest.effectiveFrom,
            }
          : null,
      };
    });
  },
};

/** Phase 1: pay period close remains in app Prisma until Payroll DB cutover. */
export const monolithPayrollDb: PayrollDb = {
  async closePayPeriod(_tenantId, _periodId) {
    throw new Error("payroll_db_cutover_required: use run-payroll service path");
  },
};

export function createMonolithPayrollPorts() {
  return {
    payrollDb: monolithPayrollDb,
    coreHrRead: monolithCoreHrEmployeeRead,
  };
}
