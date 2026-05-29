export type PaystubApiLine = {
  label: string;
  amountMinor: number;
  lineType: string;
};

export type PaystubApiShape = {
  paymentInstructionId?: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  currencyCode: string;
  grossPayMinor: number;
  netPayMinor: number;
  earnings: PaystubApiLine[];
  preTaxDeductions: PaystubApiLine[];
  taxes: PaystubApiLine[];
};
