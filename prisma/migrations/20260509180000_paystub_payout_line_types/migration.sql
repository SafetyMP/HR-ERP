-- Employee earnings-statement lines (Feature 001): deductions and tax withholdings
ALTER TYPE "PayoutLineType" ADD VALUE 'PRE_TAX_DEDUCTION';
ALTER TYPE "PayoutLineType" ADD VALUE 'TAX_WITHHOLDING';
