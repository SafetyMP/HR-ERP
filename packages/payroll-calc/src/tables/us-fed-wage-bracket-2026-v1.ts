import type { ProgressiveTaxTable } from "../policy";

/**
 * US federal income tax — engineering v1 wage-bracket schedule (annualized minor units, USD scale 2).
 *
 * **Not IRS Publication 15-T.** For deterministic gross-to-net and golden-vector regression only.
 * Production requires counsel-approved tables keyed by this `versionId` for replay.
 *
 * @see specs/alignment/decisions/0005-us-federal-withholding-v1.md
 */
export const US_FED_WAGE_BRACKET_2026_v1: ProgressiveTaxTable = {
  versionId: "US_FED_WAGE_BRACKET_2026_v1",
  brackets: [
    {
      lowerInclusiveMinor: 0n,
      upperExclusiveMinor: 11_600_00n,
      marginalRateNumerator: 10n,
      marginalRateDenominator: 100n,
    },
    {
      lowerInclusiveMinor: 11_600_00n,
      upperExclusiveMinor: 47_150_00n,
      marginalRateNumerator: 12n,
      marginalRateDenominator: 100n,
    },
    {
      lowerInclusiveMinor: 47_150_00n,
      upperExclusiveMinor: 100_525_00n,
      marginalRateNumerator: 22n,
      marginalRateDenominator: 100n,
    },
    {
      lowerInclusiveMinor: 100_525_00n,
      upperExclusiveMinor: 191_950_00n,
      marginalRateNumerator: 24n,
      marginalRateDenominator: 100n,
    },
    {
      lowerInclusiveMinor: 191_950_00n,
      upperExclusiveMinor: 243_725_00n,
      marginalRateNumerator: 32n,
      marginalRateDenominator: 100n,
    },
    {
      lowerInclusiveMinor: 243_725_00n,
      upperExclusiveMinor: 609_350_00n,
      marginalRateNumerator: 35n,
      marginalRateDenominator: 100n,
    },
    {
      lowerInclusiveMinor: 609_350_00n,
      upperExclusiveMinor: null,
      marginalRateNumerator: 37n,
      marginalRateDenominator: 100n,
    },
  ],
};
