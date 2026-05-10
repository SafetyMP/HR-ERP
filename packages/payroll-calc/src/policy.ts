import type { RoundingMode } from "./numerics";
import { applyRationalRate } from "./numerics";

/** Table handles stored beside payroll results for deterministic replay across parallel workers. */
export interface PayrollPolicyRelease {
  readonly progressiveFederalId?: string | null;
  readonly commissionTierSetId?: string | null;
}

/** Versioned progressive schedule on non-negative taxable income (half-open bands). */
export interface ProgressiveTaxTable {
  readonly versionId: string;
  /** Bands ordered ascending; callers should normally keep bands contiguous from `0n`. */
  readonly brackets: readonly {
    readonly lowerInclusiveMinor: bigint;
    readonly upperExclusiveMinor?: bigint | null;
    readonly marginalRateNumerator: bigint;
    readonly marginalRateDenominator: bigint;
  }[];
}

export interface CommissionTierTable {
  readonly versionId: string;
  readonly tiers: readonly {
    readonly lowerInclusiveMinor: bigint;
    readonly upperExclusiveMinor?: bigint | null;
    readonly commissionRateNumerator: bigint;
    readonly commissionRateDenominator: bigint;
  }[];
}

function minBig(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

/**
 * Marginal brackets: taxable slice in `[L,U)` contributes `rate * max(0, min(T,U) - L)`.
 * This matches standard tiered commission math and common simplified withholding ladders.
 */
export function progressiveIncomeTaxMinor(
  taxableIncomeMinorNonNegative: bigint,
  table: ProgressiveTaxTable,
  rounding: RoundingMode,
): bigint {
  if (taxableIncomeMinorNonNegative < 0n) {
    throw new RangeError("taxableIncomeMinorNonNegative must be >= 0");
  }
  let tax = 0n;
  for (const bracket of table.brackets) {
    const upperExclusive = bracket.upperExclusiveMinor ?? null;
    const cappedTopExclusive = upperExclusive == null ? taxableIncomeMinorNonNegative : upperExclusive;

    const coveredTop = minBig(taxableIncomeMinorNonNegative, cappedTopExclusive);
    if (coveredTop <= bracket.lowerInclusiveMinor) continue;

    const taxableSlice = coveredTop - bracket.lowerInclusiveMinor;
    tax += applyRationalRate(
      taxableSlice,
      bracket.marginalRateNumerator,
      bracket.marginalRateDenominator,
      rounding,
    );

    if (upperExclusive != null && taxableIncomeMinorNonNegative <= upperExclusive) {
      break;
    }
    if (upperExclusive == null) break;
  }
  return tax;
}

/** Staggered commission tiers attributable to qualifying sales/minor attainment. */
export function tieredCommissionMinor(
  eligibleSalesMinorNonNegative: bigint,
  table: CommissionTierTable,
  rounding: RoundingMode,
): bigint {
  if (eligibleSalesMinorNonNegative < 0n) {
    throw new RangeError("eligibleSalesMinorNonNegative must be >= 0");
  }

  let commission = 0n;
  for (const tier of table.tiers) {
    const upperExclusive = tier.upperExclusiveMinor ?? null;
    const cappedTopExclusive = upperExclusive == null ? eligibleSalesMinorNonNegative : upperExclusive;

    const coveredTop = minBig(eligibleSalesMinorNonNegative, cappedTopExclusive);
    if (coveredTop <= tier.lowerInclusiveMinor) continue;

    const commissionSlice = coveredTop - tier.lowerInclusiveMinor;
    commission += applyRationalRate(
      commissionSlice,
      tier.commissionRateNumerator,
      tier.commissionRateDenominator,
      rounding,
    );

    if (upperExclusive != null && eligibleSalesMinorNonNegative <= upperExclusive) {
      break;
    }
    if (upperExclusive == null) break;
  }
  return commission;
}
