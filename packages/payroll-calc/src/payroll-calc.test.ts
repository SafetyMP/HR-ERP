import { describe, expect, it } from "vitest";

import { civilDate } from "./dates.js";
import { moneyFromMinor } from "./numerics.js";
import { computePayroll, computePayrollBatchParallel } from "./compute.js";
import type { CommissionTierTable, ProgressiveTaxTable } from "./policy.js";
import { progressiveIncomeTaxMinor, tieredCommissionMinor } from "./policy.js";
import { segmentizePayPeriod } from "./segmentizer.js";
import type { GrossToNetPipelineInput } from "./pipeline.js";
import { runGrossToNetPipeline } from "./pipeline.js";

const USD = {
  cc: "USD",
  scale: 2,
  m(minor: bigint) {
    return moneyFromMinor({ currencyCode: this.cc, scale: this.scale, minor });
  },
} as const;

const federalDummy: ProgressiveTaxTable = {
  versionId: "US_FED_DUAL_BRACKET_DUMMY",
  brackets: [
    {
      lowerInclusiveMinor: 0n,
      upperExclusiveMinor: 50_000n,
      marginalRateNumerator: 10n,
      marginalRateDenominator: 100n,
    },
    {
      lowerInclusiveMinor: 50_000n,
      upperExclusiveMinor: null,
      marginalRateNumerator: 20n,
      marginalRateDenominator: 100n,
    },
  ],
};

const commissionDummy: CommissionTierTable = {
  versionId: "COMM_STAGGERED_DUMMY",
  tiers: [
    {
      lowerInclusiveMinor: 0n,
      upperExclusiveMinor: 100_000n,
      commissionRateNumerator: 5n,
      commissionRateDenominator: 100n,
    },
    {
      lowerInclusiveMinor: 100_000n,
      upperExclusiveMinor: null,
      commissionRateNumerator: 12n,
      commissionRateDenominator: 100n,
    },
  ],
};

function baseInputs(overrides: Partial<GrossToNetPipelineInput> = {}): GrossToNetPipelineInput {
  return {
    employeeId: "emp_1",
    payRunId: "run_2026_01",
    calcSemanticVersion: "payroll-calc@0.1.0",
    currencyCode: USD.cc,
    currencyScale: USD.scale,
    payPeriod: {
      startInclusive: civilDate("2026-01-01"),
      endExclusive: civilDate("2026-01-31"),
    },
    compensationSlices: [
      {
        effectiveStartInclusive: civilDate("2020-01-01"),
        fullPeriodGrossTarget: USD.m(5_000_00n),
      },
    ],
    proration: { kind: "calendar_days" },
    rounding: "half_up",
    pretaxDeductions: [
      {
        id: "401k_traditional",
        amountMinor: 200_00n,
        reducesFederalTaxableWages: true,
        reducesNet: true,
      },
    ],
    standardDeductionMinor: 10_000n,
    federalTaxTable: federalDummy,
    policyRelease: {
      progressiveFederalId: federalDummy.versionId,
      commissionTierSetId: null,
    },
    ...overrides,
  };
}

describe("progressiveIncomeTaxMinor (golden)", () => {
  it("splits income across two marginal brackets", () => {
    const tax = progressiveIncomeTaxMinor(75_000n, federalDummy, "half_up");
    expect(tax).toBe(10_000n);
  });
});

describe("tieredCommissionMinor (golden)", () => {
  it("applies staggered commission percentages", () => {
    const commission = tieredCommissionMinor(150_000n, commissionDummy, "half_up");
    expect(commission).toBe(11_000n);
  });
});

describe("segmentizer mid-cycle raise", () => {
  it("prorates calendar-day segments that rational-partition the pay window", () => {
    const payPeriod = {
      startInclusive: civilDate("2026-04-01"),
      endExclusive: civilDate("2026-05-01"),
    };
    const slices = [
      {
        effectiveStartInclusive: civilDate("2026-01-01"),
        effectiveEndExclusive: civilDate("2026-04-12"),
        fullPeriodGrossTarget: USD.m(3_000_00n),
      },
      {
        effectiveStartInclusive: civilDate("2026-04-12"),
        fullPeriodGrossTarget: USD.m(3_300_00n),
      },
    ];
    const segments = segmentizePayPeriod(payPeriod, slices, { kind: "calendar_days" }, "half_up");
    expect(segments).toHaveLength(2);
    expect(segments[0]!.calendarDays).toBe(11n);
    expect(segments[1]!.calendarDays).toBe(19n);
    const sum = segments.reduce((a, s) => a + s.segmentGross.minor, 0n);
    expect(sum).toBe(319_000n);
    expect(segments[0]!.periodFraction.denominator).toBe(30n);
    expect(segments[1]!.periodFraction.denominator).toBe(30n);
    expect(segments[0]!.periodFraction.numerator + segments[1]!.periodFraction.numerator).toBe(30n);
  });
});

describe("computePayroll determinism / idempotency", () => {
  it("produces identical fingerprints and net pay across repeated executions", () => {
    const input = baseInputs({
      commissionEligibleSalesMinor: 150_000n,
      commissionTable: commissionDummy,
      policyRelease: {
        progressiveFederalId: federalDummy.versionId,
        commissionTierSetId: commissionDummy.versionId,
      },
    });
    const a = computePayroll(input);
    const b = computePayroll(input);
    expect(a.inputsFingerprintSha256).toBe(b.inputsFingerprintSha256);
    expect(a.netPay.minor).toBe(b.netPay.minor);
    expect(a.pipeline.audits.grossCompositionSumEqualsPhaseTotal).toBe(true);
    expect(a.pipeline.audits.pretaxSumEqualsPhaseTotal).toBe(true);
  });

  it("maps batches without cross-worker coupling", () => {
    const i1 = baseInputs({ employeeId: "a" });
    const i2 = baseInputs({ employeeId: "b" });
    const batch = computePayrollBatchParallel([i1, i2]);
    expect(batch).toHaveLength(2);
    expect(batch[0]!.inputsFingerprintSha256).not.toBe(batch[1]!.inputsFingerprintSha256);
  });
});

describe("pipeline integration rounding boundary", () => {
  it("honors audits for gross composition and pretax lines", () => {
    const output = runGrossToNetPipeline(baseInputs({}));
    expect(output.audits.grossCompositionSumEqualsPhaseTotal).toBe(true);
    expect(output.audits.pretaxSumEqualsPhaseTotal).toBe(true);
    expect(output.phaseLines.taxableFederal.wageMinorAfterPretax).toBeGreaterThanOrEqual(
      output.phaseLines.taxableFederal.taxableIncomeMinorAfterStandard,
    );
  });
});
