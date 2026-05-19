import { describe, expect, it } from "vitest";

import { computeUkNiClass1Bootstrap } from "./ni";
import { computeUkPayeBootstrap } from "./paye";

describe("UK payroll bootstrap golden vectors", () => {
  it("PAYE BR code taxes at 20% flat on period taxable pay", () => {
    const result = computeUkPayeBootstrap({
      taxCode: "BR",
      taxablePayPeriodMinor: 3_000_00n,
      payPeriodIndexInYear: 1,
      priorTaxPaidYearToDateMinor: 0n,
      priorTaxablePayYearToDateMinor: 0n,
    });
    expect(result.payeDuePeriodMinor).toBe(600_00n);
  });

  it("PAYE NT code yields zero", () => {
    const result = computeUkPayeBootstrap({
      taxCode: "NT",
      taxablePayPeriodMinor: 5_000_00n,
      payPeriodIndexInYear: 1,
      priorTaxPaidYearToDateMinor: 0n,
      priorTaxablePayYearToDateMinor: 0n,
    });
    expect(result.payeDuePeriodMinor).toBe(0n);
  });

  it("NI category A on £3,000 monthly gross produces positive employee and employer NIC", () => {
    const result = computeUkNiClass1Bootstrap({
      grossPayPeriodMinor: 3_000_00n,
      niCategoryLetter: "A",
    });
    expect(result.employeeNiMinor).toBeGreaterThan(0n);
    expect(result.employerNiMinor).toBeGreaterThan(0n);
    expect(result.employeeNiMinor).toBe(156_24n);
    expect(result.employerNiMinor).toBe(292_95n);
  });
});
