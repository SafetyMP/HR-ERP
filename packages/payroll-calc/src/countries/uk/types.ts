/** UK payroll kernel bootstrap types (engineering spike — not HMRC-certified). */

export const UK_PAYE_VERSION_ID = "UK_PAYE_BOOTSTRAP_2026_27_v1";
export const UK_NI_VERSION_ID = "UK_NI_CLASS1_BOOTSTRAP_2026_27_v1";

export interface UkPayeInput {
  readonly taxCode: string;
  readonly taxablePayPeriodMinor: bigint;
  readonly payPeriodIndexInYear: number;
  readonly priorTaxPaidYearToDateMinor: bigint;
  readonly priorTaxablePayYearToDateMinor: bigint;
}

export interface UkPayeResult {
  readonly versionId: string;
  readonly payeDuePeriodMinor: bigint;
}

export interface UkNiInput {
  readonly grossPayPeriodMinor: bigint;
  readonly niCategoryLetter: string;
}

export interface UkNiResult {
  readonly versionId: string;
  readonly employeeNiMinor: bigint;
  readonly employerNiMinor: bigint;
}
