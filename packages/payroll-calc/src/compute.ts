import { sha256Hex, stableStringify } from "./canonicalJson.js";
import type { CanonicalMoney } from "./numerics.js";
import type { GrossToNetPipelineInput, GrossToNetPipelineResult } from "./pipeline.js";
import { runGrossToNetPipeline } from "./pipeline.js";

export interface PayrollComputationOutput {
  readonly inputsFingerprintSha256: string;
  readonly calcSemanticVersion: string;
  readonly netPay: CanonicalMoney;
  readonly pipeline: GrossToNetPipelineResult;
}

/** Pure/idempotent payroll snapshot: identical canonical inputs ⇒ identical fingerprints and outputs. */
export function computePayroll(input: GrossToNetPipelineInput): PayrollComputationOutput {
  const fingerprintPayload = {
    calcSemanticVersion: input.calcSemanticVersion,
    employeeId: input.employeeId,
    payRunId: input.payRunId,
    currencyCode: input.currencyCode,
    currencyScale: input.currencyScale,
    payPeriod: input.payPeriod,
    compensationSlices: input.compensationSlices,
    proration: input.proration,
    rounding: input.rounding,
    pretaxDeductions: input.pretaxDeductions,
    standardDeductionMinor: input.standardDeductionMinor,
    federalTaxTable: input.federalTaxTable,
    policyRelease: input.policyRelease,
    commissionEligibleSalesMinor: input.commissionEligibleSalesMinor ?? null,
    commissionTable: input.commissionTable ?? null,
  };
  const inputsFingerprintSha256 = sha256Hex(stableStringify(fingerprintPayload));
  const pipeline = runGrossToNetPipeline(input);
  return {
    inputsFingerprintSha256,
    calcSemanticVersion: input.calcSemanticVersion,
    netPay: pipeline.phaseLines.netPay,
    pipeline,
  };
}

/** Map/reduce-safe batch orchestration — no shared caches; workers may process slices independently. */
export function computePayrollBatchParallel(
  inputs: readonly GrossToNetPipelineInput[],
): readonly PayrollComputationOutput[] {
  return inputs.map((i) => computePayroll(i));
}
