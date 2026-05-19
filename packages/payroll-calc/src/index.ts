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
  AdditionalGrossLine,
  GrossToNetPipelineInput,
  GrossToNetPipelineResult,
  PipelinePhaseMoneyLine,
  PretaxDeductionRule,
} from "./pipeline";
export { runGrossToNetPipeline } from "./pipeline";

export type { PayrollComputationOutput } from "./compute";
export { computePayroll, computePayrollBatchParallel } from "./compute";

export { sha256Hex, stableStringify } from "./canonicalJson";

export { US_FED_WAGE_BRACKET_2026_v1 } from "./tables/us-fed-wage-bracket-2026-v1";

export { computeUkPayeBootstrap } from "./countries/uk/paye";
export { computeUkNiClass1Bootstrap } from "./countries/uk/ni";
export type {
  UkNiInput,
  UkNiResult,
  UkPayeInput,
  UkPayeResult,
} from "./countries/uk/types";
export {
  UK_NI_VERSION_ID,
  UK_PAYE_VERSION_ID,
} from "./countries/uk/types";
