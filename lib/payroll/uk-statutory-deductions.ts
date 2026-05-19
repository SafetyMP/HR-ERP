import {
  computeUkNiClass1Bootstrap,
  computeUkPayeBootstrap,
  type PayrollComputationOutput,
  UK_NI_VERSION_ID,
  UK_PAYE_VERSION_ID,
} from "@hr-erp/payroll-calc";

export type UkStatutoryDeductions = {
  payeMinor: bigint;
  employeeNiMinor: bigint;
  employerNiMinor: bigint;
  payeVersionId: string;
  niVersionId: string;
  adjustedNetMinor: bigint;
};

/**
 * Applies UK PAYE + Class 1 NIC bootstrap on period gross (engineering spike — not HMRC filing).
 * @see specs/alignment/decisions/0007-uk-payroll-bootstrap-spike.md
 */
export function applyUkStatutoryDeductions(args: {
  computation: PayrollComputationOutput;
  grossPeriodMinor: bigint;
  /** 1-based index within tax year; bootstrap uses 1 when unknown. */
  payPeriodIndexInYear?: number;
  taxCode?: string;
  niCategoryLetter?: string;
}): UkStatutoryDeductions {
  const payPeriodIndex = args.payPeriodIndexInYear ?? 1;
  const taxablePayPeriodMinor = args.grossPeriodMinor;

  const paye = computeUkPayeBootstrap({
    taxCode: args.taxCode ?? "1257L",
    taxablePayPeriodMinor,
    payPeriodIndexInYear: payPeriodIndex,
    priorTaxablePayYearToDateMinor: 0n,
    priorTaxPaidYearToDateMinor: 0n,
  });

  const ni = computeUkNiClass1Bootstrap({
    grossPayPeriodMinor: args.grossPeriodMinor,
    niCategoryLetter: args.niCategoryLetter ?? "A",
  });

  const totalDeductions = paye.payeDuePeriodMinor + ni.employeeNiMinor;
  const adjustedNetMinor =
    args.computation.netPay.minor > totalDeductions
      ? args.computation.netPay.minor - totalDeductions
      : 0n;

  return {
    payeMinor: paye.payeDuePeriodMinor,
    employeeNiMinor: ni.employeeNiMinor,
    employerNiMinor: ni.employerNiMinor,
    payeVersionId: UK_PAYE_VERSION_ID,
    niVersionId: UK_NI_VERSION_ID,
    adjustedNetMinor,
  };
}

export function grossPeriodMinorFromComputation(
  computation: PayrollComputationOutput,
): bigint {
  return computation.pipeline.phaseLines.grossComposition.reduce(
    (sum, line) => sum + line.amount.minor,
    0n,
  );
}
