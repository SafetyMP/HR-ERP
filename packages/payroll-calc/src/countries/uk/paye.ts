import type { UkPayeInput, UkPayeResult } from "./types";
import { UK_PAYE_VERSION_ID } from "./types";

/**
 * Simplified cumulative PAYE for bootstrap (standard code 1257L equivalent).
 * Production must use counsel-approved HMRC tables.
 */
export function computeUkPayeBootstrap(input: UkPayeInput): UkPayeResult {
  const code = input.taxCode.trim().toUpperCase();
  if (code === "BR") {
    const paye = (input.taxablePayPeriodMinor * 20n) / 100n;
    return { versionId: UK_PAYE_VERSION_ID, payeDuePeriodMinor: paye };
  }
  if (code === "NT") {
    return { versionId: UK_PAYE_VERSION_ID, payeDuePeriodMinor: 0n };
  }

  const annualAllowanceMinor = 12_570_00n;
  const periodAllowance =
    annualAllowanceMinor / BigInt(Math.max(1, 12 - input.payPeriodIndexInYear + 12));
  const ytdTaxable = input.priorTaxablePayYearToDateMinor + input.taxablePayPeriodMinor;
  const ytdAllowance =
    (annualAllowanceMinor * BigInt(input.payPeriodIndexInYear)) / 12n;
  const taxableYtd = ytdTaxable > ytdAllowance ? ytdTaxable - ytdAllowance : 0n;

  const basicBandMinor = 37_700_00n;
  const basicTax = taxableYtd > basicBandMinor ? basicBandMinor : taxableYtd;
  const higherTax =
    taxableYtd > basicBandMinor ? taxableYtd - basicBandMinor : 0n;
  const taxYtd = (basicTax * 20n) / 100n + (higherTax * 40n) / 100n;
  const payeDue =
    taxYtd > input.priorTaxPaidYearToDateMinor
      ? taxYtd - input.priorTaxPaidYearToDateMinor
      : 0n;

  return { versionId: UK_PAYE_VERSION_ID, payeDuePeriodMinor: payeDue };
}
