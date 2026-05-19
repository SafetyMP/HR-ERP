import type { UkNiInput, UkNiResult } from "./types";
import { UK_NI_VERSION_ID } from "./types";

/** 2026/27 engineering bootstrap thresholds (minor units GBP). */
const PRIMARY_THRESHOLD_PERIOD_MINOR = 1_047_00n;
const UEL_PERIOD_MINOR = 4_189_00n;
const EMPLOYEE_RATE_BELOW_UEL = 8n;
const EMPLOYEE_RATE_ABOVE_UEL = 2n;
const EMPLOYER_RATE = 15n;
const RATE_DENOM = 100n;

/**
 * Class 1 NIC bootstrap — category A default. Not HMRC-exact.
 */
export function computeUkNiClass1Bootstrap(input: UkNiInput): UkNiResult {
  if (input.niCategoryLetter.toUpperCase() === "X") {
    return {
      versionId: UK_NI_VERSION_ID,
      employeeNiMinor: 0n,
      employerNiMinor: 0n,
    };
  }

  const gross = input.grossPayPeriodMinor;
  const niable = gross > PRIMARY_THRESHOLD_PERIOD_MINOR
    ? gross - PRIMARY_THRESHOLD_PERIOD_MINOR
    : 0n;
  const belowUel = niable > UEL_PERIOD_MINOR ? UEL_PERIOD_MINOR : niable;
  const aboveUel = niable > UEL_PERIOD_MINOR ? niable - UEL_PERIOD_MINOR : 0n;

  const employeeNi =
    (belowUel * EMPLOYEE_RATE_BELOW_UEL) / RATE_DENOM +
    (aboveUel * EMPLOYEE_RATE_ABOVE_UEL) / RATE_DENOM;
  const employerNi = (niable * EMPLOYER_RATE) / RATE_DENOM;

  return {
    versionId: UK_NI_VERSION_ID,
    employeeNiMinor: employeeNi,
    employerNiMinor: employerNi,
  };
}
