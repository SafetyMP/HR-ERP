import type { DateIntervalIso } from "./calendar.js";
import type { ProgressiveTaxTable, CommissionTierTable, PayrollPolicyRelease } from "./policy.js";
import {
  progressiveIncomeTaxMinor,
  tieredCommissionMinor,
} from "./policy.js";
import type { PaySegment, ProrationStrategy, CompensationRateSlice } from "./segmentizer.js";
import {
  aggregateSegmentGross,
  segmentizePayPeriod,
} from "./segmentizer.js";
import type { CanonicalMoney, RoundingMode } from "./numerics.js";
import { assertSameCurrencyMoney, moneyAdd, moneyFromMinor, zeroMoney } from "./numerics.js";

export interface PretaxDeductionRule {
  readonly id: string;
  readonly amountMinor: bigint;
  /** When true, reduces cash net (e.g., traditional 401k employee deferral). */
  readonly reducesNet: boolean;
  /** When true, reduces federal taxable wages after gross composition. */
  readonly reducesFederalTaxableWages: boolean;
}

export interface GrossToNetPipelineInput {
  readonly employeeId: string;
  readonly payRunId: string;
  readonly calcSemanticVersion: string;
  readonly currencyCode: string;
  readonly currencyScale: number;
  readonly payPeriod: DateIntervalIso;
  readonly compensationSlices: readonly CompensationRateSlice[];
  readonly proration: ProrationStrategy;
  readonly rounding: RoundingMode;
  readonly pretaxDeductions: readonly PretaxDeductionRule[];
  readonly standardDeductionMinor: bigint;
  readonly federalTaxTable: ProgressiveTaxTable;
  readonly policyRelease: PayrollPolicyRelease;
  /** Optional commission basis (minor units) evaluated through `commissionTable`. */
  readonly commissionEligibleSalesMinor?: bigint | null;
  readonly commissionTable?: CommissionTierTable | null;
}

export interface PipelinePhaseMoneyLine {
  readonly code: string;
  readonly amount: CanonicalMoney;
}

export interface GrossToNetPipelineResult {
  readonly segments: readonly PaySegment[];
  readonly phaseLines: {
    readonly grossComposition: readonly PipelinePhaseMoneyLine[];
    readonly pretax: readonly PipelinePhaseMoneyLine[];
    readonly taxableFederal: {
      readonly wageMinorAfterPretax: bigint;
      readonly taxableIncomeMinorAfterStandard: bigint;
      readonly standardDeductionMinor: bigint;
    };
    readonly federalWithholding: readonly PipelinePhaseMoneyLine[];
    readonly netPay: CanonicalMoney;
  };
  readonly audits: {
    readonly grossCompositionSumEqualsPhaseTotal: boolean;
    readonly pretaxSumEqualsPhaseTotal: boolean;
  };
}

function moneyMinor(currencyCode: string, scale: number, minor: bigint): CanonicalMoney {
  return moneyFromMinor({ currencyCode, scale, minor });
}

export function runGrossToNetPipeline(input: GrossToNetPipelineInput): GrossToNetPipelineResult {
  const { currencyCode, currencyScale } = input;
  const segments = segmentizePayPeriod(
    input.payPeriod,
    input.compensationSlices,
    input.proration,
    input.rounding,
  );
  const baseGross = aggregateSegmentGross(segments);

  const grossLines: PipelinePhaseMoneyLine[] = [
    { code: "base_salary_prorated", amount: baseGross },
  ];

  let runningGross = baseGross;

  if (input.commissionTable && input.commissionEligibleSalesMinor != null) {
    const commissionMinor = tieredCommissionMinor(
      input.commissionEligibleSalesMinor,
      input.commissionTable,
      input.rounding,
    );
    const commissionMoney = moneyMinor(currencyCode, currencyScale, commissionMinor);
    grossLines.push({ code: "tiered_commission", amount: commissionMoney });
    runningGross = moneyAdd(runningGross, commissionMoney);
  }

  const grossCompositionPhaseTotal = grossLines.reduce(
    (acc, line) => moneyAdd(acc, line.amount),
    zeroMoney(currencyCode, currencyScale),
  );
  assertSameCurrencyMoney(grossCompositionPhaseTotal, runningGross);

  const pretaxLines: PipelinePhaseMoneyLine[] = [];
  let taxableWageMinor = runningGross.minor;
  let netMinor = runningGross.minor;

  for (const d of input.pretaxDeductions) {
    const take = d.amountMinor < 0n ? 0n : d.amountMinor;
    pretaxLines.push({
      code: d.id,
      amount: moneyMinor(currencyCode, currencyScale, take),
    });

    if (d.reducesFederalTaxableWages) {
      taxableWageMinor = maxZeroMinus(taxableWageMinor, take);
    }
    if (d.reducesNet) {
      netMinor = maxZeroMinus(netMinor, take);
    }
  }

  const pretaxPhaseTotalMinor = pretaxLines.reduce((a, l) => a + l.amount.minor, 0n);
  const pretaxChecksum = pretaxLines.reduce(
    (acc, line) => moneyAdd(acc, line.amount),
    zeroMoney(currencyCode, currencyScale),
  );

  const wageMinorAfterPretax = taxableWageMinor;
  taxableWageMinor = maxZeroMinus(taxableWageMinor, input.standardDeductionMinor);
  const taxableForProgressive =
    taxableWageMinor < 0n ? 0n : taxableWageMinor;

  const federalTaxMinor = progressiveIncomeTaxMinor(
    taxableForProgressive,
    input.federalTaxTable,
    input.rounding,
  );

  const withholdingLines: PipelinePhaseMoneyLine[] = [
    {
      code: "federal_progressive_stub",
      amount: moneyMinor(currencyCode, currencyScale, federalTaxMinor),
    },
  ];

  netMinor = maxZeroMinus(netMinor, federalTaxMinor);
  const netPay = moneyMinor(currencyCode, currencyScale, netMinor);

  return {
    segments,
    phaseLines: {
      grossComposition: grossLines,
      pretax: pretaxLines,
      taxableFederal: {
        wageMinorAfterPretax,
        taxableIncomeMinorAfterStandard: taxableForProgressive,
        standardDeductionMinor: input.standardDeductionMinor,
      },
      federalWithholding: withholdingLines,
      netPay,
    },
    audits: {
      grossCompositionSumEqualsPhaseTotal:
        grossLines.reduce((a, l) => a + l.amount.minor, 0n) === runningGross.minor,
      pretaxSumEqualsPhaseTotal: pretaxPhaseTotalMinor === pretaxChecksum.minor,
    },
  };
}

function maxZeroMinus(a: bigint, b: bigint): bigint {
  const v = a - b;
  return v < 0n ? 0n : v;
}
