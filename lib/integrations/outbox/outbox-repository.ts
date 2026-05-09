import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { JOB_TYPES, VENDOR_KEYS } from "@/lib/integrations/constants";
import type { JobType } from "@/lib/integrations/constants";
import { integrationOutboxPayload } from "@/lib/integrations/outbox/outbox-payload";
import { randomUUID } from "node:crypto";

export async function createOutboxEntry(
  tx: Prisma.TransactionClient,
  input: {
    tenantId?: string | null;
    jobType: JobType;
    payload: Prisma.InputJsonValue;
  },
): Promise<{ id: string }> {
  return tx.integrationOutbox.create({
    data: {
      tenantId: input.tenantId ?? null,
      jobType: input.jobType,
      payload: input.payload,
    },
    select: { id: true },
  });
}

/** Dev-only smoke: enqueue NOOP rows via API or script after migrate. */
export async function enqueueNoopOutbox(tenantId: string): Promise<string> {
  const row = await prisma.integrationOutbox.create({
    data: {
      tenantId,
      jobType: JOB_TYPES.NOOP_TEST,
      payload: integrationOutboxPayload({
        correlationId: randomUUID(),
        vendorKey: VENDOR_KEYS.SYSTEM,
      }) as Prisma.InputJsonValue,
    },
  });
  return row.id;
}
