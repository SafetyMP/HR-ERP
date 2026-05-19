import {
  FED_ZERO_PLACEHOLDER_v1,
  type ProgressiveTaxTable,
  US_FED_WAGE_BRACKET_2026_v1,
} from "@hr-erp/payroll-calc";

import {
  DEFAULT_ANNUAL_STANDARD_DEDUCTION_MINOR,
  DEFAULT_FEDERAL_TAX_TABLE,
  DEFAULT_POLICY_RELEASE_ID,
} from "@/lib/payroll/policy-defaults";

export type PayrollJurisdiction = "US" | "GB";

/** Maps organization `jurisdictionCountry` to payroll statutory path. */
export function resolvePayrollJurisdiction(
  country: string | null | undefined,
): PayrollJurisdiction {
  const normalized = (country ?? "US").trim().toUpperCase();
  if (normalized === "GB" || normalized === "UK") {
    return "GB";
  }
  return "US";
}

export type JurisdictionPipelineDefaults = {
  jurisdiction: PayrollJurisdiction;
  federalTaxTable: ProgressiveTaxTable;
  standardDeductionMinor: bigint;
  policyRelease: {
    progressiveFederalId: string | null;
    commissionTierSetId: string | null;
  };
};

export function pipelineDefaultsForJurisdiction(
  jurisdiction: PayrollJurisdiction,
): JurisdictionPipelineDefaults {
  if (jurisdiction === "GB") {
    return {
      jurisdiction,
      federalTaxTable: FED_ZERO_PLACEHOLDER_v1,
      standardDeductionMinor: 0n,
      policyRelease: {
        progressiveFederalId: null,
        commissionTierSetId: null,
      },
    };
  }
  return {
    jurisdiction,
    federalTaxTable: DEFAULT_FEDERAL_TAX_TABLE,
    standardDeductionMinor: DEFAULT_ANNUAL_STANDARD_DEDUCTION_MINOR,
    policyRelease: {
      progressiveFederalId: DEFAULT_FEDERAL_TAX_TABLE.versionId,
      commissionTierSetId: null,
    },
  };
}

/** Documented policy bundle id written to pay-run memo (US vs UK bootstrap). */
export function policyReleaseIdForJurisdiction(jurisdiction: PayrollJurisdiction): string {
  if (jurisdiction === "GB") {
    return `${DEFAULT_POLICY_RELEASE_ID}_GB_BOOTSTRAP`;
  }
  return DEFAULT_POLICY_RELEASE_ID;
}

export { US_FED_WAGE_BRACKET_2026_v1 };
