import {
  CALC_SEMANTIC_VERSION,
} from "@/lib/payroll/policy-defaults";
import { policyReleaseIdForJurisdiction } from "@/lib/payroll/payroll-jurisdiction";
import { hashFilingPayload } from "@/lib/payroll/filing-artifact-hash";

export type UkFilingArtifactBuildInput = {
  payrollPeriodId: string;
  startDate: string;
  endDate: string;
  instructions: readonly {
    employeeId: string;
    paymentInstructionId: string;
    inputsFingerprintSha256: string | null;
    netPayMinor: number;
    currencyCode: string;
    ukStatutory?: {
      payeVersionId: string;
      niVersionId: string;
    };
  }[];
  openExceptionCount: number;
};

export function buildUkFilingArtifact(input: UkFilingArtifactBuildInput) {
  const policyReleaseId = policyReleaseIdForJurisdiction("GB");
  const payload = {
    kind: "uk_rti_period_stub_v1",
    payrollPeriodId: input.payrollPeriodId,
    period: { startDate: input.startDate, endDate: input.endDate },
    calcSemanticVersion: CALC_SEMANTIC_VERSION,
    policyReleaseId,
    employeeCount: input.instructions.length,
    totalNetPayMinor: input.instructions.reduce((s, r) => s + r.netPayMinor, 0),
    openExceptionCount: input.openExceptionCount,
    employees: input.instructions.map((r) => ({
      employeeId: r.employeeId,
      paymentInstructionId: r.paymentInstructionId,
      inputsFingerprintSha256: r.inputsFingerprintSha256,
      netPayMinor: r.netPayMinor,
      currencyCode: r.currencyCode,
      ukStatutory: r.ukStatutory ?? null,
    })),
    counselNotice:
      "RTI-style summary stub only — not submitted to HMRC. Live RTI requires counsel gate.",
  };
  const payloadHash = hashFilingPayload(payload);
  return {
    jurisdiction: "GB",
    versionId: `uk_rti_stub_v1:${CALC_SEMANTIC_VERSION}`,
    payloadHash,
    payload,
  };
}
