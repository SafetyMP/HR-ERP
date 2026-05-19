import { describe, expect, it } from "vitest";

import { progressiveIncomeTaxMinor } from "../policy";
import { US_FED_WAGE_BRACKET_2026_v1 } from "./us-fed-wage-bracket-2026-v1";

/** Golden vectors: annualized federal taxable income (minor) → expected annual withholding (minor). */
const GOLDEN_VECTORS: ReadonlyArray<{
  readonly label: string;
  readonly taxableAnnualMinor: bigint;
  readonly expectedWithholdingMinor: bigint;
}> = [
  {
    label: "zero_wages",
    taxableAnnualMinor: 0n,
    expectedWithholdingMinor: 0n,
  },
  {
    label: "first_bracket_10pct_only",
    taxableAnnualMinor: 10_000_00n,
    expectedWithholdingMinor: 1_000_00n,
  },
  {
    label: "span_10_and_12",
    taxableAnnualMinor: 20_000_00n,
    // 11_600 @ 10% = 1_160; 8_400 @ 12% = 1_008 → 2_168
    expectedWithholdingMinor: 2_168_00n,
  },
  {
    label: "mid_22_bracket",
    taxableAnnualMinor: 75_000_00n,
    // 11_600@10%=1160; 35_550@12%=4266; 27_850@22%=6127 → 11_553
    expectedWithholdingMinor: 11_553_00n,
  },
  {
    label: "top_marginal_37",
    taxableAnnualMinor: 700_000_00n,
    expectedWithholdingMinor: 217_187_75n,
  },
] as const;

describe("US_FED_WAGE_BRACKET_2026_v1 golden vectors", () => {
  it.each(GOLDEN_VECTORS)(
    "$label taxable=$taxableAnnualMinor withholding=$expectedWithholdingMinor",
    ({ taxableAnnualMinor, expectedWithholdingMinor }) => {
      const withholding = progressiveIncomeTaxMinor(
        taxableAnnualMinor,
        US_FED_WAGE_BRACKET_2026_v1,
        "half_up",
      );
      expect(withholding).toBe(expectedWithholdingMinor);
    },
  );

  it("versionId is stable for replay", () => {
    expect(US_FED_WAGE_BRACKET_2026_v1.versionId).toBe(
      "US_FED_WAGE_BRACKET_2026_v1",
    );
  });
});
