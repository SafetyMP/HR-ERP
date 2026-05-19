import { randomUUID } from "node:crypto";

import type { Prisma } from "@/app/generated/prisma/client";
import {
  fanOutWebhookDeliveries,
  isWebhookFanOutOnEnqueueEnabled,
} from "@/lib/webhooks/fan-out";

/**
 * Unified outbox API. Phase 1 (single Postgres) writes to `IntegrationOutbox`;
 * Phase 2 (per-context Postgres + Kafka) will route domain events to the
 * relevant `domain_outbox` table without changing this signature.
 *
 * See `specs/alignment/decisions/0004-modular-monolith-phase1.md` for the
 * phasing decision.
 */
export type DomainEventCategory =
  | "domain.core_hr"
  | "domain.payroll"
  | "domain.benefits"
  | "domain.recruiting"
  | "domain.learning"
  | "domain.governance"
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

/**
 * Persist a domain or integration event in the active transaction. Returns the
 * generated outbox row id and a finalized correlation id.
 *
 * Callers MUST invoke this within an `withAuthorizedTransaction` (or compatible
 * `prisma.$transaction`) so the row is committed atomically with the
 * domain mutation.
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
