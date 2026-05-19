import { describe, expect, it } from "vitest";

import {
  hourlyRateMinorFromAnnual,
  premiumGrossLinesFromAllocation,
} from "@/lib/payroll/premium-pay-minor";

describe("premiumGrossLinesFromAllocation", () => {
  it("computes OT and DT gross lines from annual base", () => {
    const annual = 52_000_00n;
    const hourly = hourlyRateMinorFromAnnual(annual);
    expect(hourly).toBe(25_00n);

    const lines = premiumGrossLinesFromAllocation(annual, {
      geoId: "US-FED",
      rulePackVersion: "test",
      regularMinutes: 40 * 60,
      overtimeMinutes: 8 * 60,
      doubletimeMinutes: 0,
      warnings: [],
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]!.code).toBe("overtime_premium_1_5x");
    expect(lines[0]!.amountMinor).toBe((8n * 60n * hourly * 3n) / (2n * 60n));
  });
});
