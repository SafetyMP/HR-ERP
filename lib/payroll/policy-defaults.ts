import {
  US_FED_WAGE_BRACKET_2026_v1,
  type ProgressiveTaxTable,
} from "@hr-erp/payroll-calc";

export const CALC_SEMANTIC_VERSION = "payroll-calc@0.1.0";

export const DEFAULT_POLICY_RELEASE_ID = "PAYROLL_DEFAULTS_2026_v1";

/**
 * Default federal withholding table (engineering v1). **Not IRS Publication 15-T.**
 * Counsel must approve before production payroll. Replay keys on `versionId`.
 *
 * @see specs/alignment/decisions/0005-us-federal-withholding-v1.md
 */
export const DEFAULT_FEDERAL_TAX_TABLE: ProgressiveTaxTable =
  US_FED_WAGE_BRACKET_2026_v1;

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
