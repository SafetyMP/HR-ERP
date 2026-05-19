import type { Prisma } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { buildUkFilingArtifact } from "@/lib/payroll/filing-artifact-uk";
import { buildUsFilingArtifact } from "@/lib/payroll/filing-artifact-us";
import {
  resolvePayrollJurisdiction,
  policyReleaseIdForJurisdiction,
} from "@/lib/payroll/payroll-jurisdiction";
import { ISO_DATE } from "@/lib/payroll/run-payroll";
import { statusAfterArtifact } from "@/lib/payroll/payroll-period-lifecycle";
import type { AuthContext } from "@/lib/security/auth-context";
import { prisma } from "@/lib/prisma";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";
import { enqueueEvent } from "@/lib/outbox/enqueue-event";

function parseMemoFingerprint(memo: string | null): string | null {
  if (!memo) return null;
  try {
    const parsed = JSON.parse(memo) as { fingerprint?: string };
    return typeof parsed.fingerprint === "string" ? parsed.fingerprint : null;
  } catch {
    return null;
  }
}

function parseUkStatutory(memo: string | null): { payeVersionId: string; niVersionId: string } | undefined {
  if (!memo) return undefined;
  try {
    const parsed = JSON.parse(memo) as {
      ukStatutory?: { payeVersionId?: string; niVersionId?: string };
    };
    if (parsed.ukStatutory?.payeVersionId && parsed.ukStatutory?.niVersionId) {
      return {
        payeVersionId: parsed.ukStatutory.payeVersionId,
        niVersionId: parsed.ukStatutory.niVersionId,
      };
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

export async function lockPayrollPeriod(auth: AuthContext, payrollPeriodId: string) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "payroll:run_execute",
      abac: { minMfa: "step_up", maxDataClassification: "confidential" },
      resourceClassification: "confidential",
    },
    async (tx) => {
      const period = await tx.payrollPeriod.findFirst({
        where: { id: payrollPeriodId, tenantId: auth.tenantId },
      });
      if (!period) {
        throw new ApiError(404, {
          code: "not_found",
          message: "payroll_period_not_found",
        });
      }
      if (period.status === "LOCKED" || period.status === "ARTIFACT_GENERATED") {
        throw new ApiError(409, {
          code: "conflict",
          message: "payroll_period_already_locked",
        });
      }
      if (period.status === "OPEN") {
        throw new ApiError(409, {
          code: "conflict",
          message: "payroll_period_not_computed",
        });
      }

      const updated = await tx.payrollPeriod.update({
        where: { id: period.id },
        data: {
          status: "LOCKED",
          lockedAt: new Date(),
          lockedBySubjectId: auth.subjectId,
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.payroll",
        eventType: "payroll.period.locked",
        correlationId: auth.correlationId,
        payload: { payrollPeriodId: period.id },
      });

      return {
        payrollPeriodId: updated.id,
        status: updated.status,
        lockedAt: updated.lockedAt?.toISOString() ?? null,
      };
    },
  );
}

export async function generateFilingArtifact(
  auth: AuthContext,
  payrollPeriodId: string,
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "payroll:run_execute",
      abac: { minMfa: "step_up", maxDataClassification: "confidential" },
      resourceClassification: "confidential",
    },
    async (tx) => {
      const period = await tx.payrollPeriod.findFirst({
        where: { id: payrollPeriodId, tenantId: auth.tenantId },
        include: {
          organization: {
            select: { jurisdictionCountry: true },
          },
          paymentInstructions: {
            include: {
              lines: true,
            },
          },
        },
      });
      if (!period) {
        throw new ApiError(404, {
          code: "not_found",
          message: "payroll_period_not_found",
        });
      }
      if (period.status !== "LOCKED" && period.status !== "ARTIFACT_GENERATED") {
        throw new ApiError(409, {
          code: "conflict",
          message: "payroll_period_must_be_locked",
        });
      }

      const openExceptionCount = await tx.payrollRunException.count({
        where: {
          tenantId: auth.tenantId,
          payrollPeriodId: period.id,
          status: "OPEN",
        },
      });

      const instructionRows = period.paymentInstructions.map((pi) => {
        const netPayMinor = pi.lines.reduce((sum, line) => {
          const sign =
            line.lineType === "TAX_WITHHOLDING" || line.lineType === "PRE_TAX_DEDUCTION"
              ? -1
              : 1;
          return sum + sign * (line.amountMinor ?? 0);
        }, 0);
        return {
          employeeId: pi.employeeId,
          paymentInstructionId: pi.id,
          inputsFingerprintSha256: parseMemoFingerprint(pi.memo),
          netPayMinor,
          currencyCode: pi.lines[0]?.currencyCode ?? "USD",
          ukStatutory: parseUkStatutory(pi.memo),
        };
      });

      const jurisdiction = resolvePayrollJurisdiction(
        period.organization.jurisdictionCountry,
      );
      const built =
        jurisdiction === "GB"
          ? buildUkFilingArtifact({
              payrollPeriodId: period.id,
              startDate: ISO_DATE(period.startDate),
              endDate: ISO_DATE(period.endDate),
              instructions: instructionRows,
              openExceptionCount,
            })
          : buildUsFilingArtifact({
              payrollPeriodId: period.id,
              startDate: ISO_DATE(period.startDate),
              endDate: ISO_DATE(period.endDate),
              policyReleaseId: policyReleaseIdForJurisdiction(jurisdiction),
              instructions: instructionRows,
              openExceptionCount,
            });

      const artifact = await tx.payrollFilingArtifact.create({
        data: {
          tenantId: auth.tenantId,
          payrollPeriodId: period.id,
          jurisdiction: built.jurisdiction,
          versionId: built.versionId,
          payloadHash: built.payloadHash,
          payloadJson: built.payload as Prisma.InputJsonValue,
        },
      });

      await tx.payrollPeriod.update({
        where: { id: period.id },
        data: { status: statusAfterArtifact() },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.payroll",
        eventType: "payroll.period.computed",
        correlationId: auth.correlationId,
        payload: {
          payrollPeriodId: period.id,
          filingArtifactId: artifact.id,
          payloadHash: artifact.payloadHash,
        },
      });

      return {
        id: artifact.id,
        payrollPeriodId: period.id,
        jurisdiction: artifact.jurisdiction,
        versionId: artifact.versionId,
        payloadHash: artifact.payloadHash,
        generatedAt: artifact.generatedAt.toISOString(),
        payload: built.payload,
      };
    },
  );
}

export async function getLatestFilingArtifact(
  auth: AuthContext,
  payrollPeriodId: string,
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "payroll:run_read",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
      resourceClassification: "confidential",
    },
    async (tx) => {
      const artifact = await tx.payrollFilingArtifact.findFirst({
        where: { payrollPeriodId, tenantId: auth.tenantId },
        orderBy: { generatedAt: "desc" },
      });
      if (!artifact) return null;
      return {
        id: artifact.id,
        payrollPeriodId: artifact.payrollPeriodId,
        jurisdiction: artifact.jurisdiction,
        versionId: artifact.versionId,
        payloadHash: artifact.payloadHash,
        generatedAt: artifact.generatedAt.toISOString(),
        payload: artifact.payloadJson,
      };
    },
  );
}
