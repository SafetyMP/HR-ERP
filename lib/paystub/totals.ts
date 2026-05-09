import type { PayoutLineType } from "@/app/generated/prisma/client";

import { isEarningsLineType } from "@/lib/paystub/line-labels";

export type PaystubLineInput = {
  lineType: PayoutLineType;
  amountMinor: number | null;
};

/**
 * Gross = sum of earnings lines with amounts.
 * Pre-tax / tax = sum of respective deduction lines (stored as positive minor units).
 * Net = gross − pre-tax − tax (employee-facing simplified statement).
 */
export function computePaystubTotals(lines: PaystubLineInput[]): {
  grossPayMinor: number;
  preTaxDeductionsMinor: number;
  taxesMinor: number;
  netPayMinor: number;
} {
  let grossPayMinor = 0;
  let preTaxDeductionsMinor = 0;
  let taxesMinor = 0;

  for (const line of lines) {
    const amt = line.amountMinor ?? 0;
    if (line.lineType === "PRE_TAX_DEDUCTION") {
      preTaxDeductionsMinor += amt;
    } else if (line.lineType === "TAX_WITHHOLDING") {
      taxesMinor += amt;
    } else if (isEarningsLineType(line.lineType)) {
      grossPayMinor += amt;
    }
  }

  const netPayMinor = grossPayMinor - preTaxDeductionsMinor - taxesMinor;

  return { grossPayMinor, preTaxDeductionsMinor, taxesMinor, netPayMinor };
}
