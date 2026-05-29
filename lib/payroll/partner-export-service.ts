import { ApiError } from "@/lib/api/v1/errors";
import { enqueueIntegrationJob } from "@/lib/integrations/queue/integration-queue";
import {
  JOB_TYPES,
  VENDOR_KEYS,
} from "@/lib/integrations/constants";
import { stableExportId } from "@/lib/integrations/instances-service";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export async function triggerPayrollPartnerExport(
  auth: AuthContext,
  payrollPeriodId: string,
) {
  const result = await withAuthorizedTransaction(
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
      if (period.status !== "LOCKED" && period.status !== "ARTIFACT_GENERATED") {
        throw new ApiError(409, {
          code: "conflict",
          message: "payroll_period_must_be_locked",
        });
      }

      const artifact = await tx.payrollFilingArtifact.findFirst({
        where: { payrollPeriodId, tenantId: auth.tenantId },
        orderBy: { generatedAt: "desc" },
      });
      if (!artifact) {
        throw new ApiError(409, {
          code: "conflict",
          message: "filing_artifact_required",
        });
      }

      const integration = await tx.integrationInstance.findUnique({
        where: {
          tenantId_vendorKey: {
            tenantId: auth.tenantId,
            vendorKey: VENDOR_KEYS.PAYROLL_PARTNER,
          },
        },
      });
      if (!integration) {
        throw new ApiError(409, {
          code: "conflict",
          message: "payroll_partner_not_configured",
        });
      }

      const exportId = stableExportId({
        tenantId: auth.tenantId,
        payrollPeriodId,
        integrationId: integration.id,
        payloadHash: artifact.payloadHash,
      });

      const existing = await tx.payrollPartnerExport.findUnique({
        where: {
          tenantId_payrollPeriodId_integrationId: {
            tenantId: auth.tenantId,
            payrollPeriodId,
            integrationId: integration.id,
          },
        },
      });

      if (existing?.status === "SUCCESS") {
        return {
          exportId: existing.exportId,
          status: existing.status,
          payloadHash: existing.payloadHash,
          idempotent: true as const,
          enqueue: null,
        };
      }

      const row =
        existing ??
        (await tx.payrollPartnerExport.create({
          data: {
            tenantId: auth.tenantId,
            payrollPeriodId,
            integrationId: integration.id,
            exportId,
            payloadHash: artifact.payloadHash,
            status: "PENDING",
          },
        }));

      return {
        exportId: row.exportId,
        status: row.status,
        payloadHash: row.payloadHash,
        idempotent: false as const,
        enqueue: {
          exportRowId: row.id,
          filingArtifactId: artifact.id,
        },
      };
    },
  );

  if (result.enqueue) {
    await enqueueIntegrationJob(
      {
        correlationId: auth.correlationId,
        tenantId: auth.tenantId,
        vendorKey: VENDOR_KEYS.PAYROLL_PARTNER,
        jobType: JOB_TYPES.PAYROLL_PARTNER_EXPORT,
        data: {
          exportRowId: result.enqueue.exportRowId,
          payrollPeriodId,
          filingArtifactId: result.enqueue.filingArtifactId,
        },
      },
      result.exportId,
    );
  }

  return {
    exportId: result.exportId,
    status: result.status,
    payloadHash: result.payloadHash,
    idempotent: result.idempotent,
  };
}

export async function getPayrollPartnerExportStatus(
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
      const rows = await tx.payrollPartnerExport.findMany({
        where: { tenantId: auth.tenantId, payrollPeriodId },
        orderBy: { createdAt: "desc" },
      });
      return rows.map((r) => ({
        exportId: r.exportId,
        status: r.status,
        payloadHash: r.payloadHash,
        lastError: r.lastError,
        updatedAt: r.updatedAt.toISOString(),
      }));
    },
  );
}
