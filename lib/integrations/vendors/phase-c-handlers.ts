import { randomUUID } from "node:crypto";

import { deliverWebhookHttp } from "@/lib/webhooks/deliver-http";
import { signWebhookPayload } from "@/lib/webhooks/signing";
import {
  decryptTokenBundle,
  getIntegrationSecret,
} from "@/lib/integrations/crypto/tokens";
import { prisma } from "@/lib/prisma";
import { VENDOR_KEYS } from "@/lib/integrations/constants";
import { IntegrationJobError } from "@/lib/integrations/workers/integration-job-processor";

type PartnerConfig = {
  targetUrl?: string;
};

export async function processPayrollPartnerExport(data: {
  exportRowId: string;
  payrollPeriodId: string;
  filingArtifactId: string;
  tenantId: string;
  correlationId: string;
}): Promise<void> {
  const row = await prisma.payrollPartnerExport.findUnique({
    where: { id: data.exportRowId },
  });
  if (!row) return;

  const integration = await prisma.integrationInstance.findUnique({
    where: { id: row.integrationId },
  });
  if (!integration?.encryptedTokenBundle) {
    await markExportFailed(row.id, "missing_partner_credentials");
    throw new IntegrationJobError("missing_partner_credentials", "fatal");
  }

  const config = (integration.configJson ?? {}) as PartnerConfig;
  if (!config.targetUrl) {
    await markExportFailed(row.id, "missing_partner_target_url");
    throw new IntegrationJobError("missing_partner_target_url", "fatal");
  }

  const artifact = await prisma.payrollFilingArtifact.findUnique({
    where: { id: data.filingArtifactId },
  });
  if (!artifact) {
    await markExportFailed(row.id, "filing_artifact_not_found");
    throw new IntegrationJobError("filing_artifact_not_found", "fatal");
  }

  const secret = decryptTokenBundle(
    getIntegrationSecret(),
    integration.encryptedTokenBundle,
  ).accessToken;

  const deliveryId = randomUUID();
  const payload = {
    exportId: row.exportId,
    payrollPeriodId: data.payrollPeriodId,
    payloadHash: artifact.payloadHash,
    jurisdiction: artifact.jurisdiction,
    versionId: artifact.versionId,
    filingArtifact: artifact.payloadJson,
  };

  const timestamp = new Date().toISOString();
  const body = {
    id: deliveryId,
    eventType: "payroll.partner.export",
    payload,
  };
  const sig = signWebhookPayload(body, secret, timestamp);

  const result = await deliverWebhookHttp({
    targetUrl: config.targetUrl,
    secret,
    eventType: "payroll.partner.export",
    payload,
    signatureHex: sig.header,
    deliveryId,
  });

  if (result.ok) {
    await prisma.payrollPartnerExport.update({
      where: { id: row.id },
      data: { status: "SUCCESS", lastError: null },
    });
    return;
  }

  await markExportFailed(row.id, result.errorMessage ?? "partner_export_failed");
  throw new IntegrationJobError(
    result.errorMessage ?? "partner_export_failed",
    "retryable",
  );
}

async function markExportFailed(exportRowId: string, message: string): Promise<void> {
  await prisma.payrollPartnerExport.update({
    where: { id: exportRowId },
    data: { status: "FAILED", lastError: message.slice(0, 500) },
  });
}

type CarrierConfig = {
  webhookUrl?: string;
};

export async function processBenefitsCarrierNotify(data: {
  lifeEventId: string;
  tenantId: string;
  correlationId: string;
}): Promise<void> {
  const lifeEvent = await prisma.benefitLifeEvent.findFirst({
    where: { id: data.lifeEventId, tenantId: data.tenantId },
    include: { employee: { select: { id: true, email: true } } },
  });
  if (!lifeEvent) return;

  const integration = await prisma.integrationInstance.findUnique({
    where: {
      tenantId_vendorKey: {
        tenantId: data.tenantId,
        vendorKey: VENDOR_KEYS.BENEFITS_CARRIER,
      },
    },
  });

  if (!integration?.encryptedTokenBundle) {
    await prisma.benefitLifeEvent.update({
      where: { id: lifeEvent.id },
      data: {
        carrierDeliveryStatus: "SKIPPED",
        carrierDeliveryError: "carrier_not_configured",
      },
    });
    return;
  }

  const config = (integration.configJson ?? {}) as CarrierConfig;
  if (!config.webhookUrl) {
    await prisma.benefitLifeEvent.update({
      where: { id: lifeEvent.id },
      data: {
        carrierDeliveryStatus: "SKIPPED",
        carrierDeliveryError: "missing_carrier_webhook_url",
      },
    });
    return;
  }

  const secret = decryptTokenBundle(
    getIntegrationSecret(),
    integration.encryptedTokenBundle,
  ).accessToken;

  const deliveryId = randomUUID();
  const payload = {
    tenantId: data.tenantId,
    employeeBusinessId: lifeEvent.employeeId,
    eventType: lifeEvent.eventType,
    effectiveDate: lifeEvent.eventDate.toISOString().slice(0, 10),
    lifeEventId: lifeEvent.id,
    status: lifeEvent.status,
  };

  const body = {
    id: deliveryId,
    eventType: "benefits.enrollment.changed",
    payload,
  };
  const sig = signWebhookPayload(body, secret, new Date().toISOString());

  const result = await deliverWebhookHttp({
    targetUrl: config.webhookUrl,
    secret,
    eventType: "benefits.enrollment.changed",
    payload,
    signatureHex: sig.header,
    deliveryId,
  });

  if (result.ok) {
    await prisma.benefitLifeEvent.update({
      where: { id: lifeEvent.id },
      data: {
        carrierDeliveryStatus: "SUCCESS",
        carrierDeliveryAt: new Date(),
        carrierDeliveryError: null,
      },
    });
    return;
  }

  await prisma.benefitLifeEvent.update({
    where: { id: lifeEvent.id },
    data: {
      carrierDeliveryStatus: "FAILED",
      carrierDeliveryAt: new Date(),
      carrierDeliveryError: (result.errorMessage ?? "delivery_failed").slice(0, 500),
    },
  });

  throw new IntegrationJobError(
    result.errorMessage ?? "carrier_notify_failed",
    "retryable",
  );
}
