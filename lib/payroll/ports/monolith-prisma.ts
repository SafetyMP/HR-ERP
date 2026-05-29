import { prisma } from "@/lib/prisma";

import type { CoreHrEmployeeRead, EmployeeFact, PayrollDb } from "@/lib/payroll/ports";

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
