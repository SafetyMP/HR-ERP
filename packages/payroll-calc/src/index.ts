export type { CivilDateIso, DateIntervalIso } from "./calendar";

export { civilDate, intersectIntervals, intervalLengthDaysUtc, utcEpochDayFromIso } from "./dates";

export type { CanonicalMoney, RoundingMode } from "./numerics";
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
} from "./numerics";

export type {
  CommissionTierTable,
  PayrollPolicyRelease,
  ProgressiveTaxTable,
} from "./policy";
export { progressiveIncomeTaxMinor, tieredCommissionMinor } from "./policy";

export type { CompensationRateSlice, PaySegment, ProrationStrategy } from "./segmentizer";
export {
  aggregateSegmentGross,
  applyResidualToSegments,
  segmentizePayPeriod,
} from "./segmentizer";

export type {
  GrossToNetPipelineInput,
  GrossToNetPipelineResult,
  PipelinePhaseMoneyLine,
  PretaxDeductionRule,
} from "./pipeline";
export { runGrossToNetPipeline } from "./pipeline";

export type { PayrollComputationOutput } from "./compute";
export { computePayroll, computePayrollBatchParallel } from "./compute";

export { sha256Hex, stableStringify } from "./canonicalJson";
