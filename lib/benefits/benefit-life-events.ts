import type { BenefitLifeEventType } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export async function createBenefitLifeEvent(
  auth: AuthContext,
  input: {
    eventType: BenefitLifeEventType;
    eventDate: string;
    description?: string;
  },
) {
  const employeeId = auth.subjectEmployeeId;
  if (!employeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  const eventDate = new Date(input.eventDate);
  if (Number.isNaN(eventDate.getTime())) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "invalid_event_date",
    });
  }

  const description = input.description?.trim().slice(0, 2000) ?? null;

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "benefits:election_intent_submit",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const row = await tx.benefitLifeEvent.create({
        data: {
          tenantId: auth.tenantId,
          employeeId,
          eventType: input.eventType,
          eventDate,
          description,
          status: "SUBMITTED",
        },
      });
      return serializeLifeEvent(row);
    },
  );
}

export async function listMyBenefitLifeEvents(auth: AuthContext) {
  const employeeId = auth.subjectEmployeeId;
  if (!employeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "benefits:read",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const rows = await tx.benefitLifeEvent.findMany({
        where: { tenantId: auth.tenantId, employeeId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return rows.map(serializeLifeEvent);
    },
  );
}

export async function listHrBenefitLifeEvents(auth: AuthContext) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "case:hr_triage",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const rows = await tx.benefitLifeEvent.findMany({
        where: {
          tenantId: auth.tenantId,
          status: { in: ["SUBMITTED", "HR_REVIEW"] },
        },
        include: {
          employee: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      });
      return rows.map((r) => ({
        ...serializeLifeEvent(r),
        employeeName:
          [r.employee.firstName, r.employee.lastName].filter(Boolean).join(" ") ||
          r.employeeId,
      }));
    },
  );
}

export async function decideBenefitLifeEvent(
  auth: AuthContext,
  lifeEventId: string,
  input: { decision: "APPLIED" | "DENIED"; hrNote?: string },
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "case:hr_triage",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const row = await tx.benefitLifeEvent.findFirst({
        where: { id: lifeEventId, tenantId: auth.tenantId },
      });
      if (!row) {
        throw new ApiError(404, {
          code: "not_found",
          message: "life_event_not_found",
        });
      }
      if (row.status === "APPLIED" || row.status === "DENIED") {
        throw new ApiError(409, {
          code: "conflict",
          message: "life_event_already_decided",
        });
      }

      let cobraEventId = row.cobraEventId;
      if (
        input.decision === "APPLIED" &&
        row.eventType === "LOSS_OF_COVERAGE" &&
        !cobraEventId
      ) {
        const electionDeadline = new Date(row.eventDate);
        electionDeadline.setUTCDate(electionDeadline.getUTCDate() + 60);
        const cobra = await tx.cobraEvent.create({
          data: {
            tenantId: auth.tenantId,
            employeeId: row.employeeId,
            qualifyingEvent: "OTHER",
            qualifyingDate: row.eventDate,
            electionDeadline,
            electionStatus: "PENDING_NOTICE",
            payload: { source: "benefit_life_event", lifeEventId: row.id },
          },
        });
        cobraEventId = cobra.id;
      }

      const updated = await tx.benefitLifeEvent.update({
        where: { id: row.id },
        data: {
          status: input.decision,
          hrNote: input.hrNote?.trim().slice(0, 2000) ?? null,
          cobraEventId,
        },
      });

      return serializeLifeEvent(updated);
    },
  );
}

function serializeLifeEvent(row: {
  id: string;
  eventType: BenefitLifeEventType;
  eventDate: Date;
  description: string | null;
  status: string;
  hrNote: string | null;
  cobraEventId: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    eventType: row.eventType,
    eventDate: row.eventDate.toISOString().slice(0, 10),
    description: row.description,
    status: row.status,
    hrNote: row.hrNote,
    cobraEventId: row.cobraEventId,
    createdAt: row.createdAt.toISOString(),
  };
}
