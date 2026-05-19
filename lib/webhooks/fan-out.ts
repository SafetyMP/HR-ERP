import type { Prisma } from "@/app/generated/prisma/client";

import { decryptWebhookSecret } from "@/lib/webhooks/secret-crypto";
import { signWebhookPayload } from "@/lib/webhooks/signing";

function subscriptionMatchesEvent(
  eventTypes: unknown,
  eventType: string,
): boolean {
  if (!Array.isArray(eventTypes)) return false;
  return eventTypes.some(
    (t) => t === eventType || t === `${eventType.split(".")[0]}.*`,
  );
}

export interface FanOutWebhookInput {
  tenantId: string;
  eventType: string;
  payload: unknown;
}

/**
 * Create PENDING webhook delivery rows for active subscriptions matching `eventType`.
 * Call inside the same transaction as the domain mutation when fan-out is enabled.
 */
export async function fanOutWebhookDeliveries(
  tx: Prisma.TransactionClient,
  input: FanOutWebhookInput,
): Promise<number> {
  const subs = await tx.webhookSubscription.findMany({
    where: { tenantId: input.tenantId, isActive: true },
    select: {
      id: true,
      secret: true,
      eventTypes: true,
    },
  });

  let created = 0;
  const body = {
    eventType: input.eventType,
    occurredAt: new Date().toISOString(),
    data: input.payload,
  };

  for (const sub of subs) {
    if (!subscriptionMatchesEvent(sub.eventTypes, input.eventType)) continue;
    const sig = signWebhookPayload(body, decryptWebhookSecret(sub.secret));
    await tx.webhookDelivery.create({
      data: {
        tenantId: input.tenantId,
        subscriptionId: sub.id,
        eventType: input.eventType,
        status: "PENDING",
        attempt: 0,
        signature: sig.hex,
        payload: body as never,
      },
    });
    created += 1;
  }

  return created;
}

export function isWebhookFanOutOnEnqueueEnabled(): boolean {
  return process.env.WEBHOOK_FANOUT_ON_ENQUEUE !== "0";
}
