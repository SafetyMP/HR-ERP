import { Prisma } from "@/app/generated/prisma/client";
import {
  computePayroll,
  civilDate,
  type GrossToNetPipelineInput,
  type PayrollComputationOutput,
} from "@hr-erp/payroll-calc";

import { ApiError } from "@/lib/api/v1/errors";
import { enqueueEvent } from "@/lib/outbox/enqueue-event";
import {
  CALC_SEMANTIC_VERSION,
  DEFAULT_ANNUAL_STANDARD_DEDUCTION_MINOR,
  DEFAULT_FEDERAL_TAX_TABLE,
  DEFAULT_POLICY_RELEASE_ID,
  currencyMinorScale,
} from "@/lib/payroll/policy-defaults";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export interface RunPayrollInput {
  payrollPeriodId: string;
  /** When omitted, runs for every employee whose latest CompensationRecord is effective by the period end. */
  employeeIds?: readonly string[];
  /** Replace prior PaymentInstruction rows for this period if true; default false (skip already-computed employees). */
  reissue?: boolean;
}

export interface RunPayrollEmployeeResult {
  employeeId: string;
  paymentInstructionId: string;
  inputsFingerprintSha256: string;
  netPayMinor: number;
  currencyCode: string;
  status: "computed" | "skipped_existing" | "reissued" | "no_compensation";
}

export interface RunPayrollSummary {
  payrollPeriodId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  reissue: boolean;
  totalEmployees: number;
  computed: number;
  skipped: number;
  withoutCompensation: number;
  results: RunPayrollEmployeeResult[];
}

export const ISO_DATE = (d: Date): string => d.toISOString().slice(0, 10);

/** Annualized amount → period amount via calendar-day proration over a 365-day year. */
export function annualToPeriodMinor(
  annualMinor: bigint,
  startDate: Date,
  endExclusive: Date,
): bigint {
  const ms = endExclusive.getTime() - startDate.getTime();
  if (ms <= 0) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "payroll_period_invalid_dates",
    });
  }
  const periodDays = BigInt(Math.round(ms / 86_400_000));
  if (periodDays <= 0n) return 0n;
  return (annualMinor * periodDays) / 365n;
}

/** Lossless `Decimal` → integer minor units. Avoids `Number` to preserve precision. */
export function decimalToMinor(
  value: { toFixed: (digits: number) => string },
  scale: number,
): bigint {
  const stringValue = value.toFixed(scale);
  const negative = stringValue.startsWith("-");
  const [wholeRaw, fracRaw = ""] = stringValue.replace("-", "").split(".");
  const wholeBig = BigInt(wholeRaw);
  const fracPadded = (fracRaw + "0".repeat(scale)).slice(0, scale);
  const fracBig = scale === 0 ? 0n : BigInt(fracPadded || "0");
  const magnitude = wholeBig * BigInt(10) ** BigInt(scale) + fracBig;
  return negative ? -magnitude : magnitude;
}

/**
 * Production payroll-run orchestration. Loads the PayrollPeriod + CompensationRecords for the
 * tenant, runs the deterministic kernel for each employee, and persists the resulting
 * PaymentInstruction + PayoutLine rows in the same RLS-scoped transaction.
 *
 * Idempotency: the inputs fingerprint is computed by `computePayroll`; the same canonical
 * input always produces the same fingerprint, so reruns can be detected and short-circuited.
 *
 * Compliance: federal tax + standard deduction defaults are stub placeholders. See
 * `policy-defaults.ts`. Real deployments must register statutory tables before opening a run.
 */
export async function runPayroll(
  auth: AuthContext,
  input: RunPayrollInput,
): Promise<RunPayrollSummary> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "payroll:run_execute",
      abac: { minMfa: "elevated", maxDataClassification: "confidential" },
      resourceClassification: "confidential",
      prismaTx: { isolationLevel: "Serializable", timeout: 60_000 },
    },
    async (tx) => {
      const period = await tx.payrollPeriod.findFirst({
        where: { id: input.payrollPeriodId, tenantId: auth.tenantId },
        include: { organization: true },
      });
      if (!period) {
        throw new ApiError(404, {
          code: "not_found",
          message: "payroll_period_not_found",
        });
      }

      const periodEndExclusive = new Date(period.endDate);
      periodEndExclusive.setUTCDate(periodEndExclusive.getUTCDate() + 1);

      const employeeWhere: Prisma.EmployeeWhereInput = {
        tenantId: auth.tenantId,
        ...(input.employeeIds?.length
          ? { id: { in: [...input.employeeIds] } }
          : {}),
      };
      const employees = await tx.employee.findMany({
        where: employeeWhere,
        include: {
          compensationRecords: {
            where: { effectiveFrom: { lte: period.endDate } },
            orderBy: { effectiveFrom: "desc" },
            take: 1,
          },
        },
      });

      const reissue = input.reissue === true;
      const results: RunPayrollEmployeeResult[] = [];
      let computed = 0;
      let skipped = 0;
      let withoutCompensation = 0;

      for (const employee of employees) {
        const latest = employee.compensationRecords[0];
        if (!latest) {
          withoutCompensation += 1;
          results.push({
            employeeId: employee.id,
            paymentInstructionId: "",
            inputsFingerprintSha256: "",
            netPayMinor: 0,
            currencyCode: latest?.currency ?? period.organization.reportingCurrency ?? "USD",
            status: "no_compensation",
          });
          continue;
        }

        const currencyCode = latest.currency ?? period.organization.reportingCurrency ?? "USD";
        const currencyScale = currencyMinorScale(currencyCode);

        const existing = await tx.paymentInstruction.findFirst({
          where: {
            tenantId: auth.tenantId,
            employeeId: employee.id,
            payrollPeriodId: period.id,
          },
          select: { id: true },
        });

        if (existing && !reissue) {
          skipped += 1;
          results.push({
            employeeId: employee.id,
            paymentInstructionId: existing.id,
            inputsFingerprintSha256: "",
            netPayMinor: 0,
            currencyCode,
            status: "skipped_existing",
          });
          continue;
        }

        const baseAnnualMinor = decimalToMinor(latest.baseAmount, currencyScale);
        const pipelineInput = buildPipelineInputForEmployee({
          employeeId: employee.id,
          payRunId: period.id,
          periodStart: period.startDate,
          periodEndExclusive,
          baseAnnualMinor,
          effectiveFrom: latest.effectiveFrom,
          currencyCode,
          currencyScale,
        });

        const computation = computePayroll(pipelineInput);
        const status = existing && reissue ? "reissued" : "computed";

        if (existing) {
          await tx.payoutLine.deleteMany({
            where: { paymentInstructionId: existing.id },
          });
          await tx.paymentInstruction.update({
            where: { id: existing.id },
            data: {
              memo: buildMemo(computation),
            },
          });
        }

        const paymentInstruction = existing
          ? await tx.paymentInstruction.findUniqueOrThrow({
              where: { id: existing.id },
            })
          : await tx.paymentInstruction.create({
              data: {
                tenantId: auth.tenantId,
                employeeId: employee.id,
                payrollPeriodId: period.id,
                memo: buildMemo(computation),
              },
            });

        const lines = buildPayoutLineRows(paymentInstruction.id, computation, currencyCode);
        if (lines.length > 0) {
          await tx.payoutLine.createMany({ data: lines });
        }

        computed += 1;
        results.push({
          employeeId: employee.id,
          paymentInstructionId: paymentInstruction.id,
          inputsFingerprintSha256: computation.inputsFingerprintSha256,
          netPayMinor: Number(computation.netPay.minor),
          currencyCode,
          status,
        });
      }

      const summary = {
        payrollPeriodId: period.id,
        tenantId: auth.tenantId,
        startDate: ISO_DATE(period.startDate),
        endDate: ISO_DATE(period.endDate),
        reissue,
        totalEmployees: employees.length,
        computed,
        skipped,
        withoutCompensation,
        results,
      };

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.payroll",
        eventType: "payroll.pay_run.computed",
        correlationId: auth.correlationId,
        payload: {
          payrollPeriodId: summary.payrollPeriodId,
          startDate: summary.startDate,
          endDate: summary.endDate,
          calcSemanticVersion: CALC_SEMANTIC_VERSION,
          policyReleaseId: DEFAULT_POLICY_RELEASE_ID,
          computed: summary.computed,
          skipped: summary.skipped,
          withoutCompensation: summary.withoutCompensation,
          totalEmployees: summary.totalEmployees,
        },
        dedupeKey: `payroll.pay_run.computed:${summary.payrollPeriodId}:${reissue ? "reissue" : "first"}`,
      });

      return summary;
    },
  );
}

export function buildPipelineInputForEmployee(args: {
  employeeId: string;
  payRunId: string;
  periodStart: Date;
  periodEndExclusive: Date;
  baseAnnualMinor: bigint;
  effectiveFrom: Date;
  currencyCode: string;
  currencyScale: number;
}): GrossToNetPipelineInput {
  const periodGrossMinor = annualToPeriodMinor(
    args.baseAnnualMinor,
    args.periodStart,
    args.periodEndExclusive,
  );
  return {
    employeeId: args.employeeId,
    payRunId: args.payRunId,
    calcSemanticVersion: CALC_SEMANTIC_VERSION,
    currencyCode: args.currencyCode,
    currencyScale: args.currencyScale,
    payPeriod: {
      startInclusive: civilDate(ISO_DATE(args.periodStart)),
      endExclusive: civilDate(ISO_DATE(args.periodEndExclusive)),
    },
    compensationSlices: [
      {
        effectiveStartInclusive: civilDate(ISO_DATE(args.effectiveFrom)),
        fullPeriodGrossTarget: {
          currencyCode: args.currencyCode,
          scale: args.currencyScale,
          minor: periodGrossMinor,
        },
      },
    ],
    proration: { kind: "calendar_days" },
    rounding: "half_up",
    pretaxDeductions: [],
    standardDeductionMinor: annualToPeriodMinor(
      DEFAULT_ANNUAL_STANDARD_DEDUCTION_MINOR,
      args.periodStart,
      args.periodEndExclusive,
    ),
    federalTaxTable: DEFAULT_FEDERAL_TAX_TABLE,
    policyRelease: {
      progressiveFederalId: DEFAULT_FEDERAL_TAX_TABLE.versionId,
      commissionTierSetId: null,
    },
  };
}

function buildMemo(computation: PayrollComputationOutput): string {
  return JSON.stringify({
    fingerprint: computation.inputsFingerprintSha256,
    calcSemanticVersion: computation.calcSemanticVersion,
    policyReleaseId: DEFAULT_POLICY_RELEASE_ID,
  });
}

function buildPayoutLineRows(
  paymentInstructionId: string,
  computation: PayrollComputationOutput,
  currencyCode: string,
): Prisma.PayoutLineCreateManyInput[] {
  const rows: Prisma.PayoutLineCreateManyInput[] = [];
  let order = 0;

  for (const line of computation.pipeline.phaseLines.grossComposition) {
    rows.push({
      paymentInstructionId,
      lineType: line.code === "tiered_commission" ? "BONUS" : "SALARY",
      sortOrder: order++,
      amountMinor: Number(line.amount.minor),
      currencyCode,
    });
  }

  for (const line of computation.pipeline.phaseLines.pretax) {
    rows.push({
      paymentInstructionId,
      lineType: "PRE_TAX_DEDUCTION",
      sortOrder: order++,
      amountMinor: Number(line.amount.minor),
      currencyCode,
    });
  }

  for (const line of computation.pipeline.phaseLines.federalWithholding) {
    rows.push({
      paymentInstructionId,
      lineType: "TAX_WITHHOLDING",
      sortOrder: order++,
      amountMinor: Number(line.amount.minor),
      currencyCode,
    });
  }

  return rows;
}
