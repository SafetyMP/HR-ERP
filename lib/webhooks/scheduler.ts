import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";
import { signWebhookPayload } from "@/lib/webhooks/signing";

const SUPPORTED_EVENT_TYPES_PREFIX = [
  "domain.",
  "integration.",
  "compliance.",
  "audit.",
];

export interface CreateSubscriptionInput {
  label: string;
  targetUrl: string;
  eventTypes: string[];
  /** 32+ char shared secret. Caller is responsible for secure transport. */
  secret: string;
}

function assertEventTypeAllowed(eventType: string): void {
  if (
    !SUPPORTED_EVENT_TYPES_PREFIX.some((prefix) => eventType.startsWith(prefix))
  ) {
    throw new ApiError(400, {
      code: "validation_error",
      message: `eventType ${eventType} is not in the allowed namespaces`,
    });
  }
}

export async function createSubscription(
  auth: AuthContext,
  input: CreateSubscriptionInput,
) {
  if (input.eventTypes.length === 0 || input.eventTypes.length > 50) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "eventTypes must contain between 1 and 50 entries",
    });
  }
  for (const t of input.eventTypes) assertEventTypeAllowed(t);
  if (!/^https:\/\//.test(input.targetUrl)) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "targetUrl must use HTTPS",
    });
  }
  if (input.secret.length < 32) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "secret must be at least 32 characters",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "integrations:webhook_subscription_write",
      resourceClassification: "confidential",
    },
    async (tx) =>
      tx.webhookSubscription.create({
        data: {
          tenantId: auth.tenantId,
          label: input.label.trim(),
          targetUrl: input.targetUrl,
          secret: input.secret,
          eventTypes: input.eventTypes,
          isActive: true,
        },
      }),
  );
}

export interface QueueDeliveryInput {
  subscriptionId: string;
  eventType: string;
  payload: unknown;
}

/**
 * Persist a delivery row in PENDING with the canonical signature precomputed.
 * The actual HTTP POST is performed by an out-of-process worker (not in
 * scope for this scaffold) that reads PENDING/RETRY rows and updates status.
 */
export async function queueDelivery(
  auth: AuthContext,
  input: QueueDeliveryInput,
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "integrations:webhook_dispatch",
      resourceClassification: "confidential",
    },
    async (tx) => {
      const sub = await tx.webhookSubscription.findFirst({
        where: { id: input.subscriptionId, tenantId: auth.tenantId },
      });
      if (!sub) {
        throw new ApiError(404, {
          code: "not_found",
          message: "webhook_subscription_not_found",
        });
      }
      if (!sub.isActive) {
        throw new ApiError(409, {
          code: "subscription_inactive",
          message: "webhook subscription is inactive",
        });
      }
      const sig = signWebhookPayload(input.payload, sub.secret);
      return tx.webhookDelivery.create({
        data: {
          tenantId: auth.tenantId,
          subscriptionId: sub.id,
          eventType: input.eventType,
          status: "PENDING",
          attempt: 0,
          signature: sig.hex,
          payload: input.payload as never,
        },
      });
    },
  );
}
