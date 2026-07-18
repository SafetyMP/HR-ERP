import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { IntegrationJobPayload } from "@/lib/integrations/workers/integration-job-processor";
import { getDrainPrisma } from "@/lib/security/drain-db";
import { withTenantTransaction } from "@/lib/security/with-tenant-transaction";

/** Persist only stable identifiers in DLQ — never raw webhook/vendor person payloads. */
export function sanitizeIntegrationJobPayloadForDlq(
  payload: IntegrationJobPayload,
): IntegrationJobPayload {
  const sanitizedData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload.data ?? {})) {
    if (/id$/i.test(key) || key === "remoteUserId") {
      sanitizedData[key] = value;
    }
  }
  return { ...payload, data: sanitizedData };
}

export async function writeIntegrationDeadLetter(input: {
  tenantId?: string | null;
  vendorKey: string;
  jobType: string;
  payload: IntegrationJobPayload;
  failureReason: string;
  correlationId?: string | null;
  attempts: number;
}): Promise<void> {
  const data = {
    tenantId: input.tenantId ?? null,
    vendorKey: input.vendorKey,
    jobType: input.jobType,
    payload: JSON.parse(
      JSON.stringify(sanitizeIntegrationJobPayloadForDlq(input.payload)),
    ) as Prisma.InputJsonValue,
    failureReason: input.failureReason.slice(0, 8000),
    correlationId: input.correlationId ?? null,
    attempts: input.attempts,
  };

  const tenantId = input.tenantId?.trim();
  if (tenantId) {
    await withTenantTransaction(prisma, tenantId, async (tx) => {
      await tx.integrationDeadLetter.create({ data });
    });
    return;
  }

  // Untenanted edge case — drain role only.
  await getDrainPrisma().integrationDeadLetter.create({ data });
}
