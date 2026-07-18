import { getIntegrationQueue } from "@/lib/integrations/queue/integration-queue";
import type { IntegrationJobPayload } from "@/lib/integrations/workers/integration-job-processor";
import type { JobType } from "@/lib/integrations/constants";
import type { IntegrationOutbox } from "@/app/generated/prisma/client";
import { getDrainPrisma } from "@/lib/security/drain-db";
import { z } from "zod";

const payloadSchema = z.object({
  correlationId: z.string(),
  vendorKey: z.string(),
  data: z.record(z.string(), z.unknown()).optional(),
});

function outboxRowToJobPayload(row: IntegrationOutbox): IntegrationJobPayload {
  const parsed = payloadSchema.safeParse(row.payload ?? {});
  if (!parsed.success) {
    throw new Error(`Invalid outbox payload for ${row.id}: ${parsed.error.message}`);
  }
  return {
    outboxId: row.id,
    correlationId: parsed.data.correlationId,
    tenantId: row.tenantId ?? "",
    vendorKey: parsed.data.vendorKey,
    jobType: row.jobType as JobType,
    data: parsed.data.data ?? {},
  };
}

/** Poll unpublished outbox rows and push to BullMQ (at-least-once). Drain role. */
export async function publishPendingOutboxBatch(limit = 50): Promise<number> {
  const drain = getDrainPrisma();
  const rows = await drain.integrationOutbox.findMany({
    where: { publishedAt: null },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  if (rows.length === 0) return 0;

  const queue = getIntegrationQueue();
  let n = 0;

  for (const row of rows) {
    const jobPayload = outboxRowToJobPayload(row);
    const jobId = `outbox-${row.id}`;

    try {
      await queue.add("run", jobPayload, { jobId });
    } catch (e) {
      const msg = String(e instanceof Error ? e.message : e);
      if (!msg.includes("JobId")) throw e;
    }

    await drain.integrationOutbox.update({
      where: { id: row.id },
      data: { publishedAt: new Date() },
    });
    n += 1;
  }

  return n;
}

