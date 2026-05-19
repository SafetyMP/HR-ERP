import type { AdditionalGrossLine } from "@hr-erp/payroll-calc";

import type { PremiumAllocationResult } from "@/lib/compliance/pay-premiums";

/** FLSA annual hours divisor for salaried hourly-rate derivation (data default). */
export const ANNUAL_WORK_HOURS = 2080;

/**
 * Derive implied hourly rate from annual base (minor units) for premium pay lines.
 */
export function hourlyRateMinorFromAnnual(baseAnnualMinor: bigint): bigint {
  if (baseAnnualMinor <= 0n) return 0n;
  return baseAnnualMinor / BigInt(ANNUAL_WORK_HOURS);
}

/**
 * OT at 1.5× and DT at 2× on top of base salary (salary covers regular hours).
 * @see specs/alignment/decisions/0006-time-to-premium-paystub-integration.md
 */
export function premiumGrossLinesFromAllocation(
  baseAnnualMinor: bigint,
  premium: PremiumAllocationResult,
): AdditionalGrossLine[] {
  const hourly = hourlyRateMinorFromAnnual(baseAnnualMinor);
  if (hourly === 0n) return [];

  const lines: AdditionalGrossLine[] = [];
  if (premium.overtimeMinutes > 0) {
    const otMinor =
      (BigInt(premium.overtimeMinutes) * hourly * 3n) / (2n * 60n);
    if (otMinor > 0n) {
      lines.push({ code: "overtime_premium_1_5x", amountMinor: otMinor });
    }
  }
  if (premium.doubletimeMinutes > 0) {
    const dtMinor =
      (BigInt(premium.doubletimeMinutes) * hourly * 2n) / 60n;
    if (dtMinor > 0n) {
      lines.push({ code: "doubletime_premium_2x", amountMinor: dtMinor });
    }
  }
  return lines;
}
