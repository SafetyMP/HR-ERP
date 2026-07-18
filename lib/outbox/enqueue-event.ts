import { randomUUID } from "node:crypto";

import type { Prisma } from "@/app/generated/prisma/client";
import {
  fanOutWebhookDeliveries,
  isWebhookFanOutOnEnqueueEnabled,
} from "@/lib/webhooks/fan-out";
import { publishInprocBus } from "@/lib/outbox/inproc-bus";

/**
 * Unified outbox API. Phase 1 writes to `IntegrationOutbox` by default.
 * When `USE_DOMAIN_OUTBOX=1`, domain.* events also land in `domain_outbox`
 * for the Kafka publisher worker. `KAFKA_BROKERS` alone does not enable dual-write.
 *
 * See `specs/alignment/decisions/0004-modular-monolith-phase1.md`.
 */
export type DomainEventCategory =
  | "domain.core_hr"
  | "domain.payroll"
  | "domain.benefits"
  | "domain.recruiting"
  | "domain.learning"
  | "domain.governance"
  | "domain.compensation"
  | "integration.vendor"
  | "integration.webhook";

export interface OutboxEventInput {
  tenantId: string | null;
  category: DomainEventCategory;
  /** A stable event type, e.g. `payroll.pay_run.computed`. */
  eventType: string;
  payload: Prisma.InputJsonValue;
  correlationId?: string;
  /** When set, dedupes events with the same key per tenant within `dedupeWindowMs`. */
  dedupeKey?: string;
  dedupeWindowMs?: number;
}

export interface EnqueuedEvent {
  outboxId: string;
  eventType: string;
  category: DomainEventCategory;
  correlationId: string;
}

const DEFAULT_DEDUPE_WINDOW_MS = 60_000;

function domainOutboxEnabled(category: DomainEventCategory): boolean {
  if (!category.startsWith("domain.")) return false;
  return process.env.USE_DOMAIN_OUTBOX === "1";
}

function topicFor(category: DomainEventCategory, eventType: string): string {
  // hr.<context>.<aggregate>.v1 — derive context from category suffix.
  const context = category.replace(/^domain\./, "").replace(/_/g, "-");
  const aggregate = eventType.split(".")[0] || "event";
  return `hr.${context}.${aggregate}.v1`;
}

/**
 * Persist a domain or integration event in the active transaction.
 */
export async function enqueueEvent(
  tx: Prisma.TransactionClient,
  input: OutboxEventInput,
): Promise<EnqueuedEvent> {
  const correlationId = input.correlationId ?? randomUUID();
  const payloadValue: Prisma.InputJsonValue = {
    eventType: input.eventType,
    category: input.category,
    correlationId,
    occurredAt: new Date().toISOString(),
    body: input.payload,
  };

  if (input.dedupeKey) {
    const window = input.dedupeWindowMs ?? DEFAULT_DEDUPE_WINDOW_MS;
    const since = new Date(Date.now() - window);
    const existing = await tx.integrationOutbox.findFirst({
      where: {
        tenantId: input.tenantId,
        jobType: jobTypeFor(input.category, input.eventType),
        createdAt: { gte: since },
      },
      select: { id: true, payload: true },
    });
    if (existing && extractDedupeKey(existing.payload) === input.dedupeKey) {
      return {
        outboxId: existing.id,
        eventType: input.eventType,
        category: input.category,
        correlationId,
      };
    }
    (payloadValue as Record<string, unknown>).dedupeKey = input.dedupeKey;
  }

  const row = await tx.integrationOutbox.create({
    data: {
      tenantId: input.tenantId,
      jobType: jobTypeFor(input.category, input.eventType),
      payload: payloadValue,
    },
    select: { id: true },
  });

  if (domainOutboxEnabled(input.category) && input.tenantId) {
    await tx.domainOutbox.create({
      data: {
        tenantId: input.tenantId,
        topic: topicFor(input.category, input.eventType),
        partitionKey: input.tenantId,
        payload: payloadValue,
        headers: {
          correlationId,
          eventType: input.eventType,
          category: input.category,
        },
      },
    });
  }

  if (
    input.tenantId &&
    isWebhookFanOutOnEnqueueEnabled() &&
    input.category.startsWith("domain.")
  ) {
    await fanOutWebhookDeliveries(tx, {
      tenantId: input.tenantId,
      eventType: input.eventType,
      payload: input.payload,
    });
  }

  // In-process bus after row insert (same TX — handlers must not commit separately).
  await publishInprocBus({
    tenantId: input.tenantId,
    category: input.category,
    eventType: input.eventType,
    payload: input.payload,
    correlationId,
    outboxId: row.id,
  });

  return {
    outboxId: row.id,
    eventType: input.eventType,
    category: input.category,
    correlationId,
  };
}

function jobTypeFor(category: DomainEventCategory, eventType: string): string {
  return `${category}:${eventType}`;
}

function extractDedupeKey(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const value = (payload as { dedupeKey?: unknown }).dedupeKey;
  return typeof value === "string" ? value : null;
}
