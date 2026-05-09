import type { TimeOffRequestStatus } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type ManagerTeamTimeOffRowPayload = {
  id: string;
  employeeId: string;
  employeeDisplayName: string;
  startDate: string;
  endDate: string;
  status: TimeOffRequestStatus;
  note: string | null;
  createdAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
};

function displayName(e: {
  preferredName: string | null;
  firstName: string | null;
  lastName: string | null;
}): string {
  const pref = e.preferredName?.trim();
  if (pref) return pref;
  const parts = [e.firstName?.trim(), e.lastName?.trim()].filter(Boolean);
  return parts.length ? parts.join(" ") : "Team member";
}

export async function listManagerTeamTimeOffRequests(
  auth: AuthContext,
): Promise<ManagerTeamTimeOffRowPayload[]> {
  const managerId = auth.subjectEmployeeId;
  if (!managerId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "leave:manager_decide",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const rows = await tx.timeOffRequest.findMany({
        where: {
          tenantId: auth.tenantId,
          employee: { managerId },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 100,
        include: {
          employee: {
            select: {
              id: true,
              preferredName: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return rows.map((row) => ({
        id: row.id,
        employeeId: row.employeeId,
        employeeDisplayName: displayName(row.employee),
        startDate: row.startDate.toISOString().slice(0, 10),
        endDate: row.endDate.toISOString().slice(0, 10),
        status: row.status,
        note: row.note,
        createdAt: row.createdAt.toISOString(),
        decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
        decisionNote: row.decisionNote,
      }));
    },
  );
}

export async function patchManagerTeamTimeOffDecision(
  auth: AuthContext,
  input: {
    requestId: string;
    decision: TimeOffRequestStatus;
    note?: string | null;
  },
): Promise<ManagerTeamTimeOffRowPayload> {
  const managerId = auth.subjectEmployeeId;
  if (!managerId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }
  if (input.decision !== "APPROVED" && input.decision !== "DENIED") {
    throw new ApiError(400, {
      code: "bad_request",
      message: "leave_decision_invalid",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "leave:manager_decide",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const row = await tx.timeOffRequest.findFirst({
        where: {
          id: input.requestId,
          tenantId: auth.tenantId,
          employee: { managerId },
        },
        include: {
          employee: {
            select: {
              id: true,
              preferredName: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!row) {
        throw new ApiError(404, {
          code: "not_found",
          message: "time_off_request_not_found",
        });
      }
      if (row.status !== "PENDING") {
        throw new ApiError(400, {
          code: "bad_request",
          message: "leave_decision_already_final",
        });
      }

      const decisionNote = input.note?.trim()
        ? input.note.trim().slice(0, 500)
        : null;
      const updated = await tx.timeOffRequest.update({
        where: { id: row.id },
        data: {
          status: input.decision,
          decidedAt: new Date(),
          decidedByEmployeeId: managerId,
          decisionNote,
        },
        include: {
          employee: {
            select: {
              id: true,
              preferredName: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return {
        id: updated.id,
        employeeId: updated.employeeId,
        employeeDisplayName: displayName(updated.employee),
        startDate: updated.startDate.toISOString().slice(0, 10),
        endDate: updated.endDate.toISOString().slice(0, 10),
        status: updated.status,
        note: updated.note,
        createdAt: updated.createdAt.toISOString(),
        decidedAt: updated.decidedAt ? updated.decidedAt.toISOString() : null,
        decisionNote: updated.decisionNote,
      };
    },
  );
}
