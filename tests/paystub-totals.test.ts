import { describe, expect, it } from "vitest";

import { computePaystubTotals } from "@/lib/paystub/totals";

describe("computePaystubTotals", () => {
  it("sums earnings, pre-tax, taxes, and net", () => {
    const out = computePaystubTotals([
      { lineType: "SALARY", amountMinor: 500_00 },
      { lineType: "BONUS", amountMinor: 50_00 },
      { lineType: "PRE_TAX_DEDUCTION", amountMinor: 25_00 },
      { lineType: "TAX_WITHHOLDING", amountMinor: 90_00 },
    ]);
    expect(out.grossPayMinor).toBe(550_00);
    expect(out.preTaxDeductionsMinor).toBe(25_00);
    expect(out.taxesMinor).toBe(90_00);
    expect(out.netPayMinor).toBe(435_00);
  });

  it("ignores contractor lines for totals", () => {
    const out = computePaystubTotals([
      { lineType: "SALARY", amountMinor: 100_00 },
      { lineType: "CONTRACTOR_PAY", amountMinor: 999_99 },
    ]);
    expect(out.grossPayMinor).toBe(100_00);
  });
});
