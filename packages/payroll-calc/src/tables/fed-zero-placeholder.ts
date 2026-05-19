import type { ProgressiveTaxTable } from "../policy";

/** Zero-rate federal placeholder for non-US gross-to-net paths (e.g. UK uses PAYE/NI post-pipeline). */
export const FED_ZERO_PLACEHOLDER_v1: ProgressiveTaxTable = {
  versionId: "FED_ZERO_PLACEHOLDER_v1",
  brackets: [
    {
      lowerInclusiveMinor: 0n,
      upperExclusiveMinor: null,
      marginalRateNumerator: 0n,
      marginalRateDenominator: 1n,
    },
  ],
};
