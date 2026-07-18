/**
 * Payroll bounded-context persistence ports.
 * Implementations: monolith Prisma (default) → dedicated Payroll DB (ADR 0012).
 */

import type { Prisma } from "@/app/generated/prisma/client";

export type EmployeeFact = {
  employeeId: string;
  tenantId: string;
  email: string;
  status: string;
};

export type EmployeePayRunFact = {
  employeeId: string;
  tenantId: string;
  email: string;
  status: string;
  jurisdictionCountry: string | null;
  jurisdictionSubdivision: string | null;
  compensation: {
    baseAmount: Prisma.Decimal;
    currency: string | null;
    effectiveFrom: Date;
  } | null;
};

export interface CoreHrEmployeeRead {
  getEmployeeFact(tenantId: string, employeeId: string): Promise<EmployeeFact | null>;
  /** Load employees + compensation for a pay run through the Core HR read port. */
  listEmployeesForPayRun(
    tx: Prisma.TransactionClient,
    args: {
      tenantId: string;
      employeeIds?: readonly string[];
      compensationEffectiveOnOrBefore: Date;
    },
  ): Promise<EmployeePayRunFact[]>;
}

export interface PayrollDb {
  /** Pay run lifecycle — Payroll context owns mutations. */
  closePayPeriod(tenantId: string, periodId: string): Promise<void>;
}

export type PayrollPorts = {
  payrollDb: PayrollDb;
  coreHrRead: CoreHrEmployeeRead;
};
