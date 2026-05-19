import { prisma } from "@/lib/prisma";
import { deliverWebhookHttp } from "@/lib/webhooks/deliver-http";
import { decryptWebhookSecret } from "@/lib/webhooks/secret-crypto";

const MAX_ATTEMPTS = 5;
const BATCH_LIMIT = 25;

function backoffMs(attempt: number): number {
  return Math.min(60_000 * 2 ** attempt, 3_600_000);
}

export interface ProcessPendingDeliveriesResult {
  processed: number;
  succeeded: number;
  failed: number;
  retryScheduled: number;
}

/**
 * Drain PENDING and due RETRY webhook deliveries (at-least-once HTTP POST).
 */
export async function processPendingWebhookDeliveries(
  fetchImpl?: typeof fetch,
): Promise<ProcessPendingDeliveriesResult> {
  const now = new Date();
  const rows = await prisma.webhookDelivery.findMany({
    where: {
      status: { in: ["PENDING", "RETRY"] },
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: "asc" },
    take: BATCH_LIMIT,
    include: {
      subscription: {
        select: { targetUrl: true, secret: true, isActive: true },
      },
    },
  });

  let succeeded = 0;
  let failed = 0;
  let retryScheduled = 0;

  for (const row of rows) {
    if (!row.subscription.isActive) {
      await prisma.webhookDelivery.update({
        where: { id: row.id },
        data: {
          status: "FAILED",
          lastError: "subscription_inactive",
        },
      });
      failed += 1;
      continue;
    }

    const result = await deliverWebhookHttp(
      {
        deliveryId: row.id,
        targetUrl: row.subscription.targetUrl,
        secret: decryptWebhookSecret(row.subscription.secret),
        eventType: row.eventType,
        payload: row.payload,
        signatureHex: row.signature,
      },
      fetchImpl,
    );

    const attempt = row.attempt + 1;

    if (result.ok) {
      await prisma.webhookDelivery.update({
        where: { id: row.id },
        data: {
          status: "SUCCESS",
          attempt,
          lastResponseCode: result.statusCode,
          lastError: null,
          deliveredAt: new Date(),
        },
      });
      succeeded += 1;
      continue;
    }

    if (attempt >= MAX_ATTEMPTS) {
      await prisma.webhookDelivery.update({
        where: { id: row.id },
        data: {
          status: "FAILED",
          attempt,
          lastResponseCode: result.statusCode || null,
          lastError: result.errorMessage,
        },
      });
      failed += 1;
    } else {
      await prisma.webhookDelivery.update({
        where: { id: row.id },
        data: {
          status: "RETRY",
          attempt,
          lastResponseCode: result.statusCode || null,
          lastError: result.errorMessage,
          scheduledAt: new Date(Date.now() + backoffMs(attempt)),
        },
      });
      retryScheduled += 1;
    }
  }

  return {
    processed: rows.length,
    succeeded,
    failed,
    retryScheduled,
  };
}
