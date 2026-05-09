import { JOB_TYPES, type JobType, VENDOR_KEYS } from "@/lib/integrations/constants";
import { prisma } from "@/lib/prisma";
import {
  demoConnector,
  demoFetchPersonRemote,
  DEMO_VENDOR_KEY,
} from "@/lib/integrations/vendors/demo/demo-connector";
import { integrationMetricInc } from "@/lib/integrations/metrics";
import {
  decryptTokenBundle,
  getIntegrationSecret,
} from "@/lib/integrations/crypto/tokens";
import { ensureTenantOrganization } from "@/lib/integrations/tenant/ensure-org";

export class IntegrationJobError extends Error {
  constructor(
    message: string,
    readonly failureClass: "retryable" | "fatal",
  ) {
    super(message);
    this.name = "IntegrationJobError";
  }
}

export type IntegrationJobPayload = {
  outboxId?: string;
  correlationId: string;
  tenantId: string;
  vendorKey: string;
  jobType: JobType;
  data: Record<string, unknown>;
};

async function ensureDemoTokenValid(integrationId: string): Promise<void> {
  const row = await prisma.integrationInstance.findUnique({
    where: { id: integrationId },
  });
  if (!row?.encryptedTokenBundle || !row.tokenExpiresAt) return;

  if (row.tokenExpiresAt <= new Date()) {
    throw new IntegrationJobError(
      "Demo integration token expired — refresh worker or re-bootstrap",
      "fatal",
    );
  }

  const bundle = decryptTokenBundle(
    getIntegrationSecret(),
    row.encryptedTokenBundle,
  );
  if (!bundle.accessToken) {
    throw new IntegrationJobError("Missing access token bundle", "fatal");
  }
}

async function upsertEmployeeFromDemoPayload(
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<{ employeeId: string; externalId: string }> {
  await ensureTenantOrganization(tenantId);

  const mapped = demoConnector.mapExternalPersonToEmployee(payload);

  const employee = await prisma.employee.upsert({
    where: {
      tenantId_email: { tenantId, email: mapped.email },
    },
    create: {
      tenantId,
      email: mapped.email,
      firstName: mapped.firstName ?? null,
      lastName: mapped.lastName ?? null,
    },
    update: {
      firstName: mapped.firstName ?? null,
      lastName: mapped.lastName ?? null,
    },
  });

  await prisma.employeeVendorLink.upsert({
    where: {
      employeeId_vendorKey: {
        employeeId: employee.id,
        vendorKey: DEMO_VENDOR_KEY,
      },
    },
    create: {
      tenantId,
      employeeId: employee.id,
      vendorKey: DEMO_VENDOR_KEY,
      externalId: mapped.externalId,
    },
    update: { externalId: mapped.externalId },
  });

  integrationMetricInc("integration_domain_upserts");
  return { employeeId: employee.id, externalId: mapped.externalId };
}

/**
 * BullMQ processor — safe for at-least-once delivery (upserts + webhook dedupe upstream).
 */
export async function processIntegrationJob(
  payload: IntegrationJobPayload,
): Promise<void> {
  const { jobType, tenantId, vendorKey, data, correlationId } = payload;

  if (jobType === JOB_TYPES.NOOP_TEST) {
    integrationMetricInc("integration_noop_processed");
    return;
  }

  if (vendorKey === VENDOR_KEYS.DEMO) {
    if (jobType === JOB_TYPES.WEBHOOK_PROCESS) {
      await upsertEmployeeFromDemoPayload(
        tenantId,
        data as Record<string, unknown>,
      );
      return;
    }

    if (jobType === JOB_TYPES.DEMO_FETCH_PERSON) {
      const integrationId = String(data.integrationId ?? "");
      const remoteId = Number(data.remoteUserId ?? 1);
      if (!integrationId) {
        throw new IntegrationJobError("missing integrationId", "fatal");
      }

      await ensureDemoTokenValid(integrationId);
      const remote = await demoFetchPersonRemote(remoteId, correlationId);
      await upsertEmployeeFromDemoPayload(
        tenantId,
        remote as unknown as Record<string, unknown>,
      );
      return;
    }
  }

  throw new IntegrationJobError(
    `Unhandled job ${jobType} for vendor ${vendorKey}`,
    "fatal",
  );
}
