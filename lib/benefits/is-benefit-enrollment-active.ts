import { utcCalendarDateString } from "@/lib/benefits/utc-calendar-date";

function toUtcDateOnly(d: Date): string {
  return utcCalendarDateString(d);
}

/**
 * Enrollment is active on `asOfUtcDate` (`YYYY-MM-DD`) when the interval
 * [effectiveFrom, effectiveTo] covers that calendar day (inclusive), UTC.
 */
export function isBenefitEnrollmentActiveOn(
  effectiveFrom: Date,
  effectiveTo: Date | null,
  asOfUtcDate: string,
): boolean {
  const from = toUtcDateOnly(effectiveFrom);
  if (from > asOfUtcDate) return false;
  if (effectiveTo === null) return true;
  const to = toUtcDateOnly(effectiveTo);
  return to >= asOfUtcDate;
}
