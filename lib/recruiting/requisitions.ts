import type { Prisma } from "@/app/generated/prisma/client";
import { ApiError } from "@/lib/api/v1/errors";
import { enqueueEvent } from "@/lib/outbox/enqueue-event";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export interface CreateRequisitionInput {
  title: string;
  departmentId?: string | null;
  jobRoleId?: string | null;
  hiringManagerId?: string | null;
  openings?: number;
  locationCountry?: string | null;
  employmentType?:
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "INTERN"
    | "TEMP";
  description?: string | null;
}

export async function createRequisition(
  auth: AuthContext,
  input: CreateRequisitionInput,
) {
  if (!input.title.trim()) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "title is required",
    });
  }
  if (input.openings !== undefined && (input.openings < 1 || input.openings > 1000)) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "openings must be between 1 and 1000",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "recruiting:requisition_write",
      resourceClassification: "internal",
    },
    async (tx) => {
      const created = await tx.jobRequisition.create({
        data: {
          tenantId: auth.tenantId,
          title: input.title.trim(),
          departmentId: input.departmentId ?? null,
          jobRoleId: input.jobRoleId ?? null,
          hiringManagerId: input.hiringManagerId ?? null,
          openings: input.openings ?? 1,
          locationCountry: input.locationCountry ?? null,
          employmentType: input.employmentType ?? "FULL_TIME",
          description: input.description ?? null,
          status: "DRAFT",
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.recruiting",
        eventType: "recruiting.requisition.created",
        correlationId: auth.correlationId,
        payload: {
          requisitionId: created.id,
          title: created.title,
          status: created.status,
        },
      });

      return created;
    },
  );
}

export async function listRequisitions(
  auth: AuthContext,
  filter: { status?: string } = {},
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "recruiting:requisition_read",
      resourceClassification: "internal",
    },
    async (tx) => {
      const where: Prisma.JobRequisitionWhereInput = {
        tenantId: auth.tenantId,
      };
      if (filter.status) {
        where.status =
          filter.status as Prisma.JobRequisitionWhereInput["status"];
      }
      return tx.jobRequisition.findMany({
        where,
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        take: 200,
      });
    },
  );
}

export async function transitionRequisitionStatus(
  auth: AuthContext,
  requisitionId: string,
  nextStatus: "DRAFT" | "OPEN" | "ON_HOLD" | "CLOSED" | "FILLED",
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "recruiting:requisition_write",
      resourceClassification: "internal",
    },
    async (tx) => {
      const existing = await tx.jobRequisition.findFirst({
        where: { id: requisitionId, tenantId: auth.tenantId },
      });
      if (!existing) {
        throw new ApiError(404, {
          code: "not_found",
          message: "requisition_not_found",
        });
      }

      const updated = await tx.jobRequisition.update({
        where: { id: requisitionId },
        data: {
          status: nextStatus,
          closedAt:
            nextStatus === "CLOSED" || nextStatus === "FILLED"
              ? new Date()
              : null,
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.recruiting",
        eventType: "recruiting.requisition.status_changed",
        correlationId: auth.correlationId,
        payload: {
          requisitionId,
          fromStatus: existing.status,
          toStatus: nextStatus,
        },
      });

      return updated;
    },
  );
}
