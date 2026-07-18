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
  computePremiumAllocationForPunches,
  isPremiumFromAttendanceEnabled,
  loadPunchesForPayPeriod,
  resolvePremiumGeoId,
} from "@/lib/payroll/premium-earnings-from-attendance";
import { premiumGrossLinesFromAllocation } from "@/lib/payroll/premium-pay-minor";
import type { AdditionalGrossLine } from "@hr-erp/payroll-calc";
import {
  pipelineDefaultsForJurisdiction,
  policyReleaseIdForJurisdiction,
  resolvePayrollJurisdiction,
} from "@/lib/payroll/payroll-jurisdiction";
import { syncExceptionsFromRunResults } from "@/lib/payroll/payroll-exceptions";
import {
  assertPeriodAllowsPayRun,
  statusAfterPayRun,
} from "@/lib/payroll/payroll-period-lifecycle";
import {
  CALC_SEMANTIC_VERSION,
  DEFAULT_POLICY_RELEASE_ID,
  currencyMinorScale,
} from "@/lib/payroll/policy-defaults";
import {
  applyUkStatutoryDeductions,
  grossPeriodMinorFromComputation,
} from "@/lib/payroll/uk-statutory-deductions";
import { createMonolithPayrollPorts } from "@/lib/payroll/ports/monolith-prisma";
import type { CoreHrEmployeeRead } from "@/lib/payroll/ports";
import { prismaBatch } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export interface RunPayrollInput {
  payrollPeriodId: string;
  /** When omitted, runs for every employee whose latest CompensationRecord is effective by the period end. */
  employeeIds?: readonly string[];
  /** Replace prior PaymentInstruction rows for this period if true; default false (skip already-computed employees). */
  reissue?: boolean;
  /** Override Core HR read port (tests / future Payroll DB cutover). */
  coreHrRead?: CoreHrEmployeeRead;
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
    prismaBatch,
    auth,
    {
      permission: "payroll:run_execute",
      abac: { minMfa: "step_up", maxDataClassification: "confidential" },
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
      assertPeriodAllowsPayRun(period.status);

      const periodEndExclusive = new Date(period.endDate);
      periodEndExclusive.setUTCDate(periodEndExclusive.getUTCDate() + 1);

      const coreHrRead =
        input.coreHrRead ?? createMonolithPayrollPorts().coreHrRead;
      const employees = await coreHrRead.listEmployeesForPayRun(tx, {
        tenantId: auth.tenantId,
        employeeIds: input.employeeIds,
        compensationEffectiveOnOrBefore: period.endDate,
      });

      const reissue = input.reissue === true;
      const results: RunPayrollEmployeeResult[] = [];
      let computed = 0;
      let skipped = 0;
      let withoutCompensation = 0;

      for (const employee of employees) {
        const latest = employee.compensation;
        if (!latest) {
          withoutCompensation += 1;
          results.push({
            employeeId: employee.employeeId,
            paymentInstructionId: "",
            inputsFingerprintSha256: "",
            netPayMinor: 0,
            currencyCode: period.organization.reportingCurrency ?? "USD",
            status: "no_compensation",
          });
          continue;
        }

        const currencyCode = latest.currency ?? period.organization.reportingCurrency ?? "USD";
        const currencyScale = currencyMinorScale(currencyCode);

        const existing = await tx.paymentInstruction.findFirst({
          where: {
            tenantId: auth.tenantId,
            employeeId: employee.employeeId,
            payrollPeriodId: period.id,
          },
          select: { id: true },
        });

        if (existing && !reissue) {
          skipped += 1;
          results.push({
            employeeId: employee.employeeId,
            paymentInstructionId: existing.id,
            inputsFingerprintSha256: "",
            netPayMinor: 0,
            currencyCode,
            status: "skipped_existing",
          });
          continue;
        }

        const baseAnnualMinor = decimalToMinor(latest.baseAmount, currencyScale);

        let additionalGrossLines: AdditionalGrossLine[] = [];
        let premiumMemo: Record<string, unknown> | null = null;
        if (isPremiumFromAttendanceEnabled()) {
          const punches = await loadPunchesForPayPeriod(
            tx,
            auth.tenantId,
            employee.employeeId,
            period.startDate,
            periodEndExclusive,
          );
          const geoId = resolvePremiumGeoId(
            employee.jurisdictionCountry,
            employee.jurisdictionSubdivision,
          );
          const premium = computePremiumAllocationForPunches({
            geoId,
            punches,
            flsaExempt: false,
          });
          additionalGrossLines = premiumGrossLinesFromAllocation(
            baseAnnualMinor,
            premium,
          );
          premiumMemo = {
            premiumFromAttendance: true,
            geoId: premium.geoId,
            rulePackVersion: premium.rulePackVersion,
            regularMinutes: premium.regularMinutes,
            overtimeMinutes: premium.overtimeMinutes,
            doubletimeMinutes: premium.doubletimeMinutes,
            additionalGrossLineCodes: additionalGrossLines.map((l) => l.code),
            warnings: premium.warnings,
          };
          await enqueueEvent(tx, {
            tenantId: auth.tenantId,
            category: "domain.payroll",
            eventType: "payroll.premium_hours.computed",
            correlationId: auth.correlationId,
            payload: {
              payrollPeriodId: period.id,
              employeeId: employee.employeeId,
              ...premiumMemo,
            },
          });
        }

        const jurisdiction = resolvePayrollJurisdiction(
          employee.jurisdictionCountry,
        );
        const jurisdictionDefaults = pipelineDefaultsForJurisdiction(jurisdiction);

        const pipelineInput = buildPipelineInputForEmployee({
          employeeId: employee.employeeId,
          payRunId: period.id,
          periodStart: period.startDate,
          periodEndExclusive,
          baseAnnualMinor,
          effectiveFrom: latest.effectiveFrom,
          currencyCode,
          currencyScale,
          additionalGrossLines,
          jurisdictionDefaults,
        });

        const computation = computePayroll(pipelineInput);
        let ukStatutory: ReturnType<typeof applyUkStatutoryDeductions> | null = null;
        if (jurisdiction === "GB") {
          const grossPeriodMinor = grossPeriodMinorFromComputation(computation);
          ukStatutory = applyUkStatutoryDeductions({
            computation,
            grossPeriodMinor,
          });
        }

        const status = existing && reissue ? "reissued" : "computed";

        const memo = buildMemo(computation, premiumMemo, jurisdiction, ukStatutory);

        if (existing) {
          await tx.payoutLine.deleteMany({
            where: { paymentInstructionId: existing.id },
          });
          await tx.paymentInstruction.update({
            where: { id: existing.id },
            data: {
              memo,
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
                employeeId: employee.employeeId,
                payrollPeriodId: period.id,
                memo,
              },
            });

        const lines = buildPayoutLineRows(
          paymentInstruction.id,
          computation,
          currencyCode,
          ukStatutory,
        );
        if (lines.length > 0) {
          await tx.payoutLine.createMany({ data: lines });
        }

        computed += 1;
        const netPayMinor = ukStatutory
          ? Number(ukStatutory.adjustedNetMinor)
          : Number(computation.netPay.minor);

        results.push({
          employeeId: employee.employeeId,
          paymentInstructionId: paymentInstruction.id,
          inputsFingerprintSha256: computation.inputsFingerprintSha256,
          netPayMinor,
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

      await syncExceptionsFromRunResults(
        tx,
        auth.tenantId,
        period.id,
        results,
      );

      const nextStatus = statusAfterPayRun(summary.computed, period.status);
      if (nextStatus !== period.status) {
        await tx.payrollPeriod.update({
          where: { id: period.id },
          data: { status: nextStatus },
        });
      }

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

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.payroll",
        eventType: "payroll.period.computed",
        correlationId: auth.correlationId,
        payload: {
          payrollPeriodId: summary.payrollPeriodId,
          periodStatus: nextStatus,
          computed: summary.computed,
        },
      });

      for (const row of results) {
        if (row.status === "no_compensation" || row.status === "skipped_existing") {
          await enqueueEvent(tx, {
            tenantId: auth.tenantId,
            category: "domain.payroll",
            eventType: "payroll.exception.opened",
            correlationId: auth.correlationId,
            payload: {
              payrollPeriodId: period.id,
              employeeId: row.employeeId,
              code: row.status === "no_compensation" ? "NO_COMPENSATION" : "SKIPPED_EXISTING",
            },
          });
        }
      }

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
  additionalGrossLines?: readonly AdditionalGrossLine[];
  jurisdictionDefaults?: ReturnType<typeof pipelineDefaultsForJurisdiction>;
}): GrossToNetPipelineInput {
  const jurisdictionDefaults =
    args.jurisdictionDefaults ?? pipelineDefaultsForJurisdiction("US");
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
      jurisdictionDefaults.standardDeductionMinor,
      args.periodStart,
      args.periodEndExclusive,
    ),
    federalTaxTable: jurisdictionDefaults.federalTaxTable,
    policyRelease: jurisdictionDefaults.policyRelease,
    additionalGrossLines: args.additionalGrossLines ?? [],
  };
}

function buildMemo(
  computation: PayrollComputationOutput,
  premium: Record<string, unknown> | null = null,
  jurisdiction: ReturnType<typeof resolvePayrollJurisdiction> = "US",
  ukStatutory: ReturnType<typeof applyUkStatutoryDeductions> | null = null,
): string {
  return JSON.stringify({
    fingerprint: computation.inputsFingerprintSha256,
    calcSemanticVersion: computation.calcSemanticVersion,
    policyReleaseId: policyReleaseIdForJurisdiction(jurisdiction),
    jurisdiction,
    ...(premium ? { premium } : {}),
    ...(ukStatutory
      ? {
          ukStatutory: {
            payeVersionId: ukStatutory.payeVersionId,
            niVersionId: ukStatutory.niVersionId,
            payeMinor: ukStatutory.payeMinor.toString(),
            employeeNiMinor: ukStatutory.employeeNiMinor.toString(),
            employerNiMinor: ukStatutory.employerNiMinor.toString(),
          },
        }
      : {}),
  });
}

function buildPayoutLineRows(
  paymentInstructionId: string,
  computation: PayrollComputationOutput,
  currencyCode: string,
  ukStatutory: ReturnType<typeof applyUkStatutoryDeductions> | null = null,
): Prisma.PayoutLineCreateManyInput[] {
  const rows: Prisma.PayoutLineCreateManyInput[] = [];
  let order = 0;

  for (const line of computation.pipeline.phaseLines.grossComposition) {
    const isPremium =
      line.code === "overtime_premium_1_5x" ||
      line.code === "doubletime_premium_2x";
    rows.push({
      paymentInstructionId,
      lineType:
        line.code === "tiered_commission" || isPremium ? "BONUS" : "SALARY",
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
    if (line.amount.minor === 0n && ukStatutory) {
      continue;
    }
    rows.push({
      paymentInstructionId,
      lineType: "TAX_WITHHOLDING",
      sortOrder: order++,
      amountMinor: Number(line.amount.minor),
      currencyCode,
    });
  }

  if (ukStatutory) {
    if (ukStatutory.payeMinor > 0n) {
      rows.push({
        paymentInstructionId,
        lineType: "TAX_WITHHOLDING",
        sortOrder: order++,
        amountMinor: Number(ukStatutory.payeMinor),
        currencyCode,
      });
    }
    if (ukStatutory.employeeNiMinor > 0n) {
      rows.push({
        paymentInstructionId,
        lineType: "TAX_WITHHOLDING",
        sortOrder: order++,
        amountMinor: Number(ukStatutory.employeeNiMinor),
        currencyCode,
      });
    }
  }

  return rows;
}
