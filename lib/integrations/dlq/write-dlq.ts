import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { IntegrationJobPayload } from "@/lib/integrations/workers/integration-job-processor";

export async function writeIntegrationDeadLetter(input: {
  tenantId?: string | null;
  vendorKey: string;
  jobType: string;
  payload: IntegrationJobPayload;
  failureReason: string;
  correlationId?: string | null;
  attempts: number;
}): Promise<void> {
  await prisma.integrationDeadLetter.create({
    data: {
      tenantId: input.tenantId ?? null,
      vendorKey: input.vendorKey,
      jobType: input.jobType,
      payload: JSON.parse(
        JSON.stringify(input.payload),
      ) as Prisma.InputJsonValue,
      failureReason: input.failureReason.slice(0, 8000),
      correlationId: input.correlationId ?? null,
      attempts: input.attempts,
    },
  });
}
