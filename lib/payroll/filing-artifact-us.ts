import {
  CALC_SEMANTIC_VERSION,
  DEFAULT_POLICY_RELEASE_ID,
} from "@/lib/payroll/policy-defaults";
import { hashFilingPayload } from "@/lib/payroll/filing-artifact-hash";

export type FilingArtifactBuildInput = {
  payrollPeriodId: string;
  startDate: string;
  endDate: string;
  policyReleaseId: string;
  instructions: readonly {
    employeeId: string;
    paymentInstructionId: string;
    inputsFingerprintSha256: string | null;
    netPayMinor: number;
    currencyCode: string;
  }[];
  openExceptionCount: number;
};

export function buildUsFilingArtifact(input: FilingArtifactBuildInput) {
  const payload = {
    kind: "us_payroll_period_summary_v1",
    payrollPeriodId: input.payrollPeriodId,
    period: { startDate: input.startDate, endDate: input.endDate },
    calcSemanticVersion: CALC_SEMANTIC_VERSION,
    policyReleaseId: input.policyReleaseId || DEFAULT_POLICY_RELEASE_ID,
    employeeCount: input.instructions.length,
    totalNetPayMinor: input.instructions.reduce((s, r) => s + r.netPayMinor, 0),
    openExceptionCount: input.openExceptionCount,
    employees: input.instructions.map((r) => ({
      employeeId: r.employeeId,
      paymentInstructionId: r.paymentInstructionId,
      inputsFingerprintSha256: r.inputsFingerprintSha256,
      netPayMinor: r.netPayMinor,
      currencyCode: r.currencyCode,
    })),
    counselNotice:
      "Engineering artifact only — not IRS e-file. Agency transmission requires Legal sign-off.",
  };
  const payloadHash = hashFilingPayload(payload);
  return {
    jurisdiction: "US",
    versionId: `us_filing_v1:${CALC_SEMANTIC_VERSION}`,
    payloadHash,
    payload,
  };
}
