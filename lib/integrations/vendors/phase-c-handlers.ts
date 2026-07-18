import { randomUUID } from "node:crypto";

import { deliverWebhookHttp } from "@/lib/webhooks/deliver-http";
import { signWebhookPayload } from "@/lib/webhooks/signing";
import {
  decryptTokenBundle,
  getIntegrationSecret,
} from "@/lib/integrations/crypto/tokens";
import { assertSafeDeliveryUrl } from "@/lib/integrations/http/assert-safe-delivery-url";
import { prisma } from "@/lib/prisma";
import { VENDOR_KEYS } from "@/lib/integrations/constants";
import { IntegrationJobError } from "@/lib/integrations/workers/integration-job-processor";
import { withTenantTransaction } from "@/lib/security/with-tenant-transaction";

type PartnerConfig = {
  targetUrl?: string;
};

function assertTenantMatch(
  expectedTenantId: string,
  actualTenantId: string,
  code: string,
): void {
  if (actualTenantId !== expectedTenantId) {
    throw new IntegrationJobError(code, "fatal");
  }
}

export async function processPayrollPartnerExport(data: {
  exportRowId: string;
  payrollPeriodId: string;
  filingArtifactId: string;
  tenantId: string;
  correlationId: string;
}): Promise<void> {
  const prepared = await withTenantTransaction(prisma, data.tenantId, async (tx) => {
    const row = await tx.payrollPartnerExport.findUnique({
      where: { id: data.exportRowId },
    });
    if (!row) return null;

    assertTenantMatch(data.tenantId, row.tenantId, "cross_tenant_export_row");
    if (row.payrollPeriodId !== data.payrollPeriodId) {
      throw new IntegrationJobError("export_period_mismatch", "fatal");
    }

    const integration = await tx.integrationInstance.findUnique({
      where: { id: row.integrationId },
    });
    if (integration) {
      assertTenantMatch(
        data.tenantId,
        integration.tenantId,
        "cross_tenant_integration",
      );
    }
    if (!integration?.encryptedTokenBundle) {
      await tx.payrollPartnerExport.update({
        where: { id: row.id },
        data: {
          status: "FAILED",
          lastError: "missing_partner_credentials".slice(0, 500),
        },
      });
      throw new IntegrationJobError("missing_partner_credentials", "fatal");
    }

    const config = (integration.configJson ?? {}) as PartnerConfig;
    if (!config.targetUrl) {
      await tx.payrollPartnerExport.update({
        where: { id: row.id },
        data: {
          status: "FAILED",
          lastError: "missing_partner_target_url".slice(0, 500),
        },
      });
      throw new IntegrationJobError("missing_partner_target_url", "fatal");
    }

    try {
      assertSafeDeliveryUrl(config.targetUrl);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "unsafe_partner_target_url";
      await tx.payrollPartnerExport.update({
        where: { id: row.id },
        data: { status: "FAILED", lastError: message.slice(0, 500) },
      });
      throw new IntegrationJobError(message, "fatal");
    }

    const artifact = await tx.payrollFilingArtifact.findUnique({
      where: { id: data.filingArtifactId },
    });
    if (artifact) {
      assertTenantMatch(
        data.tenantId,
        artifact.tenantId,
        "cross_tenant_filing_artifact",
      );
    }
    if (!artifact) {
      await tx.payrollPartnerExport.update({
        where: { id: row.id },
        data: {
          status: "FAILED",
          lastError: "filing_artifact_not_found".slice(0, 500),
        },
      });
      throw new IntegrationJobError("filing_artifact_not_found", "fatal");
    }

    return {
      rowId: row.id,
      exportId: row.exportId,
      targetUrl: config.targetUrl,
      encryptedTokenBundle: integration.encryptedTokenBundle,
      artifact,
    };
  });

  if (!prepared) return;

  const secret = decryptTokenBundle(
    getIntegrationSecret(),
    prepared.encryptedTokenBundle,
  ).accessToken;

  const deliveryId = randomUUID();
  const payload = {
    exportId: prepared.exportId,
    payrollPeriodId: data.payrollPeriodId,
    payloadHash: prepared.artifact.payloadHash,
    jurisdiction: prepared.artifact.jurisdiction,
    versionId: prepared.artifact.versionId,
    filingArtifact: prepared.artifact.payloadJson,
  };

  const timestamp = new Date().toISOString();
  const body = {
    id: deliveryId,
    eventType: "payroll.partner.export",
    payload,
  };
  const sig = signWebhookPayload(body, secret, timestamp);

  const result = await deliverWebhookHttp({
    targetUrl: prepared.targetUrl,
    secret,
    eventType: "payroll.partner.export",
    payload,
    signatureHex: sig.header,
    deliveryId,
  });

  await withTenantTransaction(prisma, data.tenantId, async (tx) => {
    if (result.ok) {
      await tx.payrollPartnerExport.update({
        where: { id: prepared.rowId },
        data: { status: "SUCCESS", lastError: null },
      });
      return;
    }
    await tx.payrollPartnerExport.update({
      where: { id: prepared.rowId },
      data: {
        status: "FAILED",
        lastError: (result.errorMessage ?? "partner_export_failed").slice(0, 500),
      },
    });
  });

  if (!result.ok) {
    throw new IntegrationJobError(
      result.errorMessage ?? "partner_export_failed",
      "retryable",
    );
  }
}

type CarrierConfig = {
  webhookUrl?: string;
};

export async function processBenefitsCarrierNotify(data: {
  lifeEventId: string;
  tenantId: string;
  correlationId: string;
}): Promise<void> {
  const prepared = await withTenantTransaction(prisma, data.tenantId, async (tx) => {
    const lifeEvent = await tx.benefitLifeEvent.findFirst({
      where: { id: data.lifeEventId, tenantId: data.tenantId },
      include: { employee: { select: { id: true, email: true } } },
    });
    if (!lifeEvent) return null;

    const integration = await tx.integrationInstance.findUnique({
      where: {
        tenantId_vendorKey: {
          tenantId: data.tenantId,
          vendorKey: VENDOR_KEYS.BENEFITS_CARRIER,
        },
      },
    });

    if (!integration?.encryptedTokenBundle) {
      await tx.benefitLifeEvent.update({
        where: { id: lifeEvent.id },
        data: {
          carrierDeliveryStatus: "SKIPPED",
          carrierDeliveryError: "carrier_not_configured",
        },
      });
      return null;
    }

    const config = (integration.configJson ?? {}) as CarrierConfig;
    if (!config.webhookUrl) {
      await tx.benefitLifeEvent.update({
        where: { id: lifeEvent.id },
        data: {
          carrierDeliveryStatus: "SKIPPED",
          carrierDeliveryError: "missing_carrier_webhook_url",
        },
      });
      return null;
    }

    try {
      assertSafeDeliveryUrl(config.webhookUrl);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "unsafe_carrier_webhook_url";
      await tx.benefitLifeEvent.update({
        where: { id: lifeEvent.id },
        data: {
          carrierDeliveryStatus: "FAILED",
          carrierDeliveryError: message.slice(0, 500),
        },
      });
      throw new IntegrationJobError(message, "fatal");
    }

    return {
      lifeEvent,
      webhookUrl: config.webhookUrl,
      encryptedTokenBundle: integration.encryptedTokenBundle,
    };
  });

  if (!prepared) return;

  const secret = decryptTokenBundle(
    getIntegrationSecret(),
    prepared.encryptedTokenBundle,
  ).accessToken;

  const deliveryId = randomUUID();
  const payload = {
    tenantId: data.tenantId,
    employeeBusinessId: prepared.lifeEvent.employeeId,
    eventType: prepared.lifeEvent.eventType,
    effectiveDate: prepared.lifeEvent.eventDate.toISOString().slice(0, 10),
    lifeEventId: prepared.lifeEvent.id,
    status: prepared.lifeEvent.status,
  };

  const body = {
    id: deliveryId,
    eventType: "benefits.enrollment.changed",
    payload,
  };
  const sig = signWebhookPayload(body, secret, new Date().toISOString());

  const result = await deliverWebhookHttp({
    targetUrl: prepared.webhookUrl,
    secret,
    eventType: "benefits.enrollment.changed",
    payload,
    signatureHex: sig.header,
    deliveryId,
  });

  await withTenantTransaction(prisma, data.tenantId, async (tx) => {
    if (result.ok) {
      await tx.benefitLifeEvent.update({
        where: { id: prepared.lifeEvent.id },
        data: {
          carrierDeliveryStatus: "SUCCESS",
          carrierDeliveryAt: new Date(),
          carrierDeliveryError: null,
        },
      });
      return;
    }
    await tx.benefitLifeEvent.update({
      where: { id: prepared.lifeEvent.id },
      data: {
        carrierDeliveryStatus: "FAILED",
        carrierDeliveryAt: new Date(),
        carrierDeliveryError: (result.errorMessage ?? "delivery_failed").slice(
          0,
          500,
        ),
      },
    });
  });

  if (!result.ok) {
    throw new IntegrationJobError(
      result.errorMessage ?? "carrier_notify_failed",
      "retryable",
    );
  }
}
