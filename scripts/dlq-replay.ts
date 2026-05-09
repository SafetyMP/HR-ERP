/**
 * Replay a dead-letter row back onto the Bull queue.
 *
 *   npx tsx scripts/dlq-replay.ts <deadLetterId>
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { enqueueIntegrationJob } from "@/lib/integrations/queue/integration-queue";
import type { IntegrationJobPayload } from "@/lib/integrations/workers/integration-job-processor";

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error("Usage: dlq-replay.ts <deadLetterId>");
    process.exit(1);
  }

  const row = await prisma.integrationDeadLetter.findUnique({ where: { id } });
  if (!row) {
    console.error("Dead letter not found");
    process.exit(1);
  }

  const payload = row.payload as unknown as IntegrationJobPayload;
  const replayJobId = `dlq-replay-${row.id}-${Date.now()}`;
  await enqueueIntegrationJob(payload, replayJobId);

  await prisma.integrationDeadLetter.update({
    where: { id: row.id },
    data: { replayedAt: new Date() },
  });

  console.log(`Replayed DLQ ${row.id} as job ${replayJobId}`);
}

void main();
