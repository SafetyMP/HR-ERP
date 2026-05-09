import type { PayoutLineType } from "@/app/generated/prisma/client";

/** Employee-facing labels — standard payroll wording (Feature 001). */
export function payoutLineTypeLabel(lineType: PayoutLineType): string {
  switch (lineType) {
    case "SALARY":
      return "Regular earnings";
    case "BONUS":
      return "Bonus";
    case "EXPENSE_REIMBURSEMENT":
      return "Expense reimbursement";
    case "PRE_TAX_DEDUCTION":
      return "Pre-tax deduction";
    case "TAX_WITHHOLDING":
      return "Tax withholding";
    case "CONTRACTOR_PAY":
      return "Contractor payment";
    default: {
      const _: never = lineType;
      return _;
    }
  }
}

export function isEarningsLineType(lineType: PayoutLineType): boolean {
  return (
    lineType === "SALARY" ||
    lineType === "BONUS" ||
    lineType === "EXPENSE_REIMBURSEMENT"
  );
}
