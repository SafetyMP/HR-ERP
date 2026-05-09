export type { CivilDateIso, DateIntervalIso } from "./calendar.js";

export { civilDate, intersectIntervals, intervalLengthDaysUtc, utcEpochDayFromIso } from "./dates.js";

export type { CanonicalMoney, RoundingMode } from "./numerics.js";
export {
  Rational,
  applyRationalRate,
  assertSameCurrencyMoney,
  moneyAdd,
  moneyFromMinor,
  moneyNeg,
  moneySubtract,
  multiplyMoneyMinor,
  zeroMoney,
} from "./numerics.js";

export type {
  CommissionTierTable,
  PayrollPolicyRelease,
  ProgressiveTaxTable,
} from "./policy.js";
export { progressiveIncomeTaxMinor, tieredCommissionMinor } from "./policy.js";

export type { CompensationRateSlice, PaySegment, ProrationStrategy } from "./segmentizer.js";
export {
  aggregateSegmentGross,
  applyResidualToSegments,
  segmentizePayPeriod,
} from "./segmentizer.js";

export type {
  GrossToNetPipelineInput,
  GrossToNetPipelineResult,
  PipelinePhaseMoneyLine,
  PretaxDeductionRule,
} from "./pipeline.js";
export { runGrossToNetPipeline } from "./pipeline.js";

export type { PayrollComputationOutput } from "./compute.js";
export { computePayroll, computePayrollBatchParallel } from "./compute.js";

export { sha256Hex, stableStringify } from "./canonicalJson.js";
