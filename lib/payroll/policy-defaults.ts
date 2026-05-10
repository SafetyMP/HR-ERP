import type { ProgressiveTaxTable } from "@hr-erp/payroll-calc";

export const CALC_SEMANTIC_VERSION = "payroll-calc@0.1.0";

export const DEFAULT_POLICY_RELEASE_ID = "PAYROLL_DEFAULTS_2026_v1";

/**
 * Stub two-bracket federal-style schedule. **Not a real IRS table** — this is a versioned
 * placeholder so the kernel can run end-to-end deterministically. Production deployments
 * must replace it with statutory tables for each supported jurisdiction; the registry is
 * keyed by `versionId` so historical runs replay against their original policy.
 */
export const DEFAULT_FEDERAL_TAX_TABLE: ProgressiveTaxTable = {
  versionId: "US_FED_PLACEHOLDER_2026_v1",
  brackets: [
    {
      lowerInclusiveMinor: 0n,
      upperExclusiveMinor: 50_000_00n,
      marginalRateNumerator: 10n,
      marginalRateDenominator: 100n,
    },
    {
      lowerInclusiveMinor: 50_000_00n,
      upperExclusiveMinor: 250_000_00n,
      marginalRateNumerator: 22n,
      marginalRateDenominator: 100n,
    },
    {
      lowerInclusiveMinor: 250_000_00n,
      upperExclusiveMinor: null,
      marginalRateNumerator: 32n,
      marginalRateDenominator: 100n,
    },
  ],
};

/** USD-equivalent annualized standard deduction placeholder, prorated per pay period in run-payroll. */
export const DEFAULT_ANNUAL_STANDARD_DEDUCTION_MINOR = 14_600_00n;

/** Minor-unit scale per ISO-4217 code we currently exercise. Kernel is currency-agnostic; this is a UX default. */
const SCALE_BY_CURRENCY: Record<string, number> = {
  USD: 2,
  CAD: 2,
  EUR: 2,
  GBP: 2,
  AUD: 2,
  NZD: 2,
  MXN: 2,
  BRL: 2,
  JPY: 0,
  KRW: 0,
  CLP: 0,
  ISK: 0,
  HUF: 2,
  CHF: 2,
  SEK: 2,
  NOK: 2,
  DKK: 2,
  INR: 2,
  SGD: 2,
};

export function currencyMinorScale(currencyCode: string): number {
  const upper = currencyCode.toUpperCase();
  if (!/^[A-Z]{3}$/.test(upper)) {
    throw new TypeError(`currencyCode must be ISO 4217 ALPHA-3, received ${JSON.stringify(currencyCode)}`);
  }
  return SCALE_BY_CURRENCY[upper] ?? 2;
}
