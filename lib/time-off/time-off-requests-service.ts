import type { TimeOffRequestStatus } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type TimeOffRequestItemPayload = {
  id: string;
  startDate: string;
  endDate: string;
  status: TimeOffRequestStatus;
  note: string | null;
  createdAt: string;
};

function inclusiveCalendarDays(startIsoDate: string, endIsoDate: string): number {
  const s = new Date(`${startIsoDate}T12:00:00.000Z`).getTime();
  const e = new Date(`${endIsoDate}T12:00:00.000Z`).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) return 0;
  return Math.floor((e - s) / 86_400_000) + 1;
}

export async function createMyTimeOffRequest(
  auth: AuthContext,
  input: { startDate: string; endDate: string; note?: string | null },
): Promise<TimeOffRequestItemPayload> {
  const employeeId = auth.subjectEmployeeId;
  if (!employeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  const days = inclusiveCalendarDays(input.startDate, input.endDate);
  if (days <= 0) {
    throw new ApiError(400, {
      code: "bad_request",
      message: "leave_invalid_range",
    });
  }
  if (days > 14) {
    throw new ApiError(400, {
      code: "bad_request",
      message: "leave_range_too_long",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "leave:self_submit",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const scoped = await tx.employee.findFirst({
        where: { id: employeeId, tenantId: auth.tenantId },
        select: { id: true },
      });
      if (!scoped) {
        throw new ApiError(404, {
          code: "not_found",
          message: "employee_not_found",
        });
      }

      const row = await tx.timeOffRequest.create({
        data: {
          tenantId: auth.tenantId,
          employeeId,
          startDate: new Date(`${input.startDate}T12:00:00.000Z`),
          endDate: new Date(`${input.endDate}T12:00:00.000Z`),
          note: input.note?.trim() ? input.note.trim().slice(0, 500) : null,
        },
      });

      return {
        id: row.id,
        startDate: row.startDate.toISOString().slice(0, 10),
        endDate: row.endDate.toISOString().slice(0, 10),
        status: row.status,
        note: row.note,
        createdAt: row.createdAt.toISOString(),
      };
    },
  );
}

export async function listMyTimeOffRequests(
  auth: AuthContext,
): Promise<TimeOffRequestItemPayload[]> {
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
      permission: "leave:self_submit",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const rows = await tx.timeOffRequest.findMany({
        where: { tenantId: auth.tenantId, employeeId },
        orderBy: [{ createdAt: "desc" }],
        take: 50,
      });

      return rows.map((row) => ({
        id: row.id,
        startDate: row.startDate.toISOString().slice(0, 10),
        endDate: row.endDate.toISOString().slice(0, 10),
        status: row.status,
        note: row.note,
        createdAt: row.createdAt.toISOString(),
      }));
    },
  );
}
