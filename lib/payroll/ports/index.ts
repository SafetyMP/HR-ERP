/**
 * Payroll bounded-context persistence ports.
 * Implementations: monolith Prisma (default) → dedicated Payroll DB (ADR 0012).
 */

export type EmployeeFact = {
  employeeId: string;
  tenantId: string;
  email: string;
  status: string;
};

export interface CoreHrEmployeeRead {
  getEmployeeFact(tenantId: string, employeeId: string): Promise<EmployeeFact | null>;
}

export interface PayrollDb {
  /** Pay run lifecycle — Payroll context owns mutations. */
  closePayPeriod(tenantId: string, periodId: string): Promise<void>;
}

export type PayrollPorts = {
  payrollDb: PayrollDb;
  coreHrRead: CoreHrEmployeeRead;
};
