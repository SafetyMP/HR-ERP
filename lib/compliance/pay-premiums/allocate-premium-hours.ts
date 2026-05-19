import { totalWorkedMinutes, workedMinutesByUtcDay } from "./worked-minutes";
import type {
  AllocatePremiumHoursInput,
  PremiumAllocationResult,
  PremiumGeoId,
} from "./types";

const RULE_PACK_VERSION = "pay-premiums-matrix@0.1.0";

const DAILY_OT_AFTER_HOURS_CA = 8;
const DAILY_DT_AFTER_HOURS_CA = 12;

function allocateUsFedWeekly(
  input: AllocatePremiumHoursInput,
  byDay: Map<string, number>,
): PremiumAllocationResult {
  const total = totalWorkedMinutes(byDay);
  const thresholdMinutes = input.standardHoursForWeeklyOt * 60;
  const ot = Math.max(0, total - thresholdMinutes);
  const regular = total - ot;
  return {
    geoId: "US-FED",
    rulePackVersion: RULE_PACK_VERSION,
    regularMinutes: regular,
    overtimeMinutes: ot,
    doubletimeMinutes: 0,
    warnings: [],
  };
}

function allocateUsCaDailyAndWeekly(
  input: AllocatePremiumHoursInput,
  byDay: Map<string, number>,
): PremiumAllocationResult {
  let regular = 0;
  let overtime = 0;
  let doubletime = 0;

  for (const dayMinutes of byDay.values()) {
    const dailyRegularCap = DAILY_OT_AFTER_HOURS_CA * 60;
    const dailyDtCap = DAILY_DT_AFTER_HOURS_CA * 60;
    const reg = Math.min(dayMinutes, dailyRegularCap);
    const after8 = Math.max(0, dayMinutes - dailyRegularCap);
    const otSlice = Math.min(after8, dailyDtCap - dailyRegularCap);
    const dtSlice = Math.max(0, dayMinutes - dailyDtCap);
    regular += reg;
    overtime += otSlice;
    doubletime += dtSlice;
  }

  const thresholdMinutes = input.standardHoursForWeeklyOt * 60;
  const total = regular + overtime + doubletime;
  if (total > thresholdMinutes) {
    const weeklyOt = total - thresholdMinutes;
    const shift = Math.min(weeklyOt, regular);
    regular -= shift;
    overtime += shift;
  }

  return {
    geoId: "US-CA",
    rulePackVersion: RULE_PACK_VERSION,
    regularMinutes: regular,
    overtimeMinutes: overtime,
    doubletimeMinutes: doubletime,
    warnings: [],
  };
}

/**
 * Deterministic premium hour buckets from attendance punches (v1 spike).
 * @see specs/alignment/decisions/0006-time-to-premium-paystub-integration.md
 */
export function allocatePremiumHours(
  input: AllocatePremiumHoursInput,
): PremiumAllocationResult {
  if (input.flsaExempt) {
    return {
      geoId: input.geoId,
      rulePackVersion: RULE_PACK_VERSION,
      regularMinutes: totalWorkedMinutes(workedMinutesByUtcDay(input.punches)),
      overtimeMinutes: 0,
      doubletimeMinutes: 0,
      warnings: ["COMPLIANCE_EXEMPT_NO_OT"],
    };
  }

  const byDay = workedMinutesByUtcDay(input.punches);

  if (input.geoId === "US-CA") {
    return allocateUsCaDailyAndWeekly(input, byDay);
  }

  // US-FED, US-NY, US-CO, US-TX: weekly OT floor in v1 spike (state variants in matrix later).
  return allocateUsFedWeekly(input, byDay);
}
