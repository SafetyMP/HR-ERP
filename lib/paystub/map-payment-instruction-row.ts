import type { PayoutLineType } from "@/app/generated/prisma/client";

import { computePaystubTotals } from "@/lib/paystub/totals";
import { payoutLineTypeLabel } from "@/lib/paystub/line-labels";

export type PaystubLinePayload = {
  label: string;
  amountMinor: number;
  lineType: PayoutLineType;
};

export type CurrentPaystubPayload = {
  paymentInstructionId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  currencyCode: string;
  grossPayMinor: number;
  netPayMinor: number;
  earnings: PaystubLinePayload[];
  preTaxDeductions: PaystubLinePayload[];
  taxes: PaystubLinePayload[];
};

export type PaystubHistorySummaryPayload = {
  paymentInstructionId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  currencyCode: string;
  grossPayMinor: number;
  netPayMinor: number;
};

type LineRow = {
  lineType: PayoutLineType;
  amountMinor: number | null;
  currencyCode: string | null;
};

type PeriodRow = {
  startDate: Date;
  endDate: Date;
};

export type PaymentInstructionRowShape = {
  id: string;
  payrollPeriod: PeriodRow | null;
  lines: LineRow[];
  employee: {
    organization: { reportingCurrency: string | null };
  };
};

export function mapPaymentInstructionToCurrentPaystub(
  row: PaymentInstructionRowShape,
): CurrentPaystubPayload | null {
  const summary = mapPaymentInstructionToSummary(row);
  if (!summary || !row.payrollPeriod) return null;

  const totals = computePaystubTotals(
    row.lines.map((l) => ({
      lineType: l.lineType,
      amountMinor: l.amountMinor,
    })),
  );

  const earnings: PaystubLinePayload[] = [];
  const preTaxDeductions: PaystubLinePayload[] = [];
  const taxes: PaystubLinePayload[] = [];

  for (const line of row.lines) {
    const amountMinor = line.amountMinor ?? 0;
    const payload: PaystubLinePayload = {
      label: payoutLineTypeLabel(line.lineType),
      amountMinor,
      lineType: line.lineType,
    };

    if (
      line.lineType === "SALARY" ||
      line.lineType === "BONUS" ||
      line.lineType === "EXPENSE_REIMBURSEMENT"
    ) {
      earnings.push(payload);
    } else if (line.lineType === "PRE_TAX_DEDUCTION") {
      preTaxDeductions.push(payload);
    } else if (line.lineType === "TAX_WITHHOLDING") {
      taxes.push(payload);
    }
  }

  return {
    paymentInstructionId: summary.paymentInstructionId,
    payPeriodStart: summary.payPeriodStart,
    payPeriodEnd: summary.payPeriodEnd,
    currencyCode: summary.currencyCode,
    grossPayMinor: totals.grossPayMinor,
    netPayMinor: totals.netPayMinor,
    earnings,
    preTaxDeductions,
    taxes,
  };
}

export function mapPaymentInstructionToSummary(
  row: PaymentInstructionRowShape,
): PaystubHistorySummaryPayload | null {
  if (!row.payrollPeriod) return null;

  const totals = computePaystubTotals(
    row.lines.map((l) => ({
      lineType: l.lineType,
      amountMinor: l.amountMinor,
    })),
  );

  const currencyCode =
    row.lines.find((l) => l.currencyCode)?.currencyCode ??
    row.employee.organization.reportingCurrency ??
    "USD";

  return {
    paymentInstructionId: row.id,
    payPeriodStart: row.payrollPeriod.startDate.toISOString().slice(0, 10),
    payPeriodEnd: row.payrollPeriod.endDate.toISOString().slice(0, 10),
    currencyCode,
    grossPayMinor: totals.grossPayMinor,
    netPayMinor: totals.netPayMinor,
  };
}
