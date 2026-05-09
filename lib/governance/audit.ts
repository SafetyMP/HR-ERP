import type { Prisma } from "@/app/generated/prisma/client";

export async function appendGovernanceAudit(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    eventType: string;
    actorSubjectId: string;
    entityType: string;
    entityId: string;
    metadata?: Prisma.InputJsonValue;
    correlationId?: string | null;
  },
) {
  return tx.governanceAuditEvent.create({
    data: {
      tenantId: input.tenantId,
      eventType: input.eventType,
      actorSubjectId: input.actorSubjectId,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? {},
      correlationId: input.correlationId ?? null,
    },
  });
}
