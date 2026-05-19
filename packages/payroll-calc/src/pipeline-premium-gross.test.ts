import { describe, expect, it } from "vitest";

import { civilDate } from "./dates";
import { moneyFromMinor } from "./numerics";
import type { GrossToNetPipelineInput } from "./pipeline";
import { runGrossToNetPipeline } from "./pipeline";

const USD = { cc: "USD", scale: 2 } as const;

const federalDummy = {
  versionId: "TEST_FED",
  brackets: [
    {
      lowerInclusiveMinor: 0n,
      upperExclusiveMinor: null,
      marginalRateNumerator: 10n,
      marginalRateDenominator: 100n,
    },
  ],
};

describe("runGrossToNetPipeline additionalGrossLines", () => {
  it("includes OT premium in gross and net", () => {
    const input: GrossToNetPipelineInput = {
      employeeId: "e1",
      payRunId: "r1",
      calcSemanticVersion: "test",
      currencyCode: USD.cc,
      currencyScale: USD.scale,
      payPeriod: {
        startInclusive: civilDate("2026-01-01"),
        endExclusive: civilDate("2026-01-31"),
      },
      compensationSlices: [
        {
          effectiveStartInclusive: civilDate("2020-01-01"),
          fullPeriodGrossTarget: moneyFromMinor({
            currencyCode: USD.cc,
            scale: USD.scale,
            minor: 4_000_00n,
          }),
        },
      ],
      proration: { kind: "calendar_days" },
      rounding: "half_up",
      pretaxDeductions: [],
      standardDeductionMinor: 0n,
      federalTaxTable: federalDummy,
      policyRelease: {},
      additionalGrossLines: [
        { code: "overtime_premium_1_5x", amountMinor: 300_00n },
      ],
    };

    const result = runGrossToNetPipeline(input);
    const codes = result.phaseLines.grossComposition.map((l) => l.code);
    expect(codes).toContain("overtime_premium_1_5x");
    expect(result.phaseLines.netPay.minor).toBeLessThan(
      4_000_00n + 300_00n,
    );
  });
});
