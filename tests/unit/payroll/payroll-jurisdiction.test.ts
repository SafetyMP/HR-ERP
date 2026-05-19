import { describe, expect, it } from "vitest";

import {
  pipelineDefaultsForJurisdiction,
  resolvePayrollJurisdiction,
} from "@/lib/payroll/payroll-jurisdiction";
import {
  applyUkStatutoryDeductions,
  grossPeriodMinorFromComputation,
} from "@/lib/payroll/uk-statutory-deductions";
import { buildPipelineInputForEmployee } from "@/lib/payroll/run-payroll";
import { computePayroll } from "@hr-erp/payroll-calc";

describe("payroll jurisdiction", () => {
  it("resolves GB from UK country codes", () => {
    expect(resolvePayrollJurisdiction("GB")).toBe("GB");
    expect(resolvePayrollJurisdiction("uk")).toBe("GB");
    expect(resolvePayrollJurisdiction("US")).toBe("US");
  });

  it("GB pipeline uses zero federal table and UK statutory reduces net", () => {
    const periodStart = new Date("2026-01-01T00:00:00.000Z");
    const periodEndExclusive = new Date("2026-01-15T00:00:00.000Z");
    const gbDefaults = pipelineDefaultsForJurisdiction("GB");
    const input = buildPipelineInputForEmployee({
      employeeId: "00000000-0000-4000-8000-000000000001",
      payRunId: "00000000-0000-4000-8000-000000000002",
      periodStart,
      periodEndExclusive,
      baseAnnualMinor: 52_000_00n,
      effectiveFrom: periodStart,
      currencyCode: "GBP",
      currencyScale: 2,
      jurisdictionDefaults: gbDefaults,
    });
    expect(input.federalTaxTable.versionId).toBe("FED_ZERO_PLACEHOLDER_v1");

    const computation = computePayroll(input);
    const gross = grossPeriodMinorFromComputation(computation);
    expect(gross).toBeGreaterThan(0n);

    const uk = applyUkStatutoryDeductions({ computation, grossPeriodMinor: gross });
    expect(uk.payeMinor + uk.employeeNiMinor).toBeGreaterThan(0n);
    expect(uk.adjustedNetMinor).toBeLessThan(computation.netPay.minor);
  });
});
