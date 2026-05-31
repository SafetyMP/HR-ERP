import type { AttendanceCorrectionStatus, PunchKind } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { applyApprovedCorrectionPunch } from "@/lib/attendance/apply-approved-correction-punch";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type AttendanceCorrectionPayload = {
  id: string;
  employeeId: string;
  employeeDisplayName: string;
  submittedByEmployeeId: string;
  punchKind: PunchKind;
  requestedOccurredAt: string;
  reason: string;
  status: AttendanceCorrectionStatus;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
  appliedPunchId?: string | null;
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

export async function createManagerAttendanceCorrection(
  auth: AuthContext,
  input: { employeeId: string; punchKind: PunchKind; requestedOccurredAt: string; reason: string },
): Promise<AttendanceCorrectionPayload> {
  const managerId = auth.subjectEmployeeId;
  if (!managerId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  const reason = input.reason.trim().slice(0, 2000);
  if (reason.length < 8) {
    throw new ApiError(400, {
      code: "bad_request",
      message: "correction_reason_too_short",
    });
  }

  let occurredAt: Date;
  try {
    occurredAt = new Date(input.requestedOccurredAt);
    if (!Number.isFinite(occurredAt.getTime())) throw new Error("invalid");
  } catch {
    throw new ApiError(400, {
      code: "bad_request",
      message: "correction_invalid_timestamp",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "attendance:correction_submit",
      abac: { minMfa: "standard", maxDataClassification: "internal" },
    },
    async (tx) => {
      const report = await tx.employee.findFirst({
        where: {
          id: input.employeeId,
          tenantId: auth.tenantId,
          managerId,
        },
        select: {
          id: true,
          preferredName: true,
          firstName: true,
          lastName: true,
        },
      });
      if (!report) {
        throw new ApiError(404, {
          code: "not_found",
          message: "direct_report_not_found",
        });
      }

      const row = await tx.attendanceCorrectionRequest.create({
        data: {
          tenantId: auth.tenantId,
          employeeId: report.id,
          submittedByEmployeeId: managerId,
          punchKind: input.punchKind,
          requestedOccurredAt: occurredAt,
          reason,
        },
        include: {
          employee: {
            select: {
              preferredName: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return {
        id: row.id,
        employeeId: row.employeeId,
        employeeDisplayName: displayName(row.employee),
        submittedByEmployeeId: row.submittedByEmployeeId,
        punchKind: row.punchKind,
        requestedOccurredAt: row.requestedOccurredAt.toISOString(),
        reason: row.reason,
        status: row.status,
        decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
        decisionNote: row.decisionNote,
        createdAt: row.createdAt.toISOString(),
      };
    },
  );
}

export async function listManagerAttendanceCorrections(
  auth: AuthContext,
): Promise<AttendanceCorrectionPayload[]> {
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
      permission: "attendance:correction_submit",
      abac: { minMfa: "standard", maxDataClassification: "internal" },
    },
    async (tx) => {
      const rows = await tx.attendanceCorrectionRequest.findMany({
        where: {
          tenantId: auth.tenantId,
          submittedByEmployeeId: managerId,
        },
        orderBy: [{ createdAt: "desc" }],
        take: 50,
        include: {
          employee: {
            select: {
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
        submittedByEmployeeId: row.submittedByEmployeeId,
        punchKind: row.punchKind,
        requestedOccurredAt: row.requestedOccurredAt.toISOString(),
        reason: row.reason,
        status: row.status,
        decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
        decisionNote: row.decisionNote,
        createdAt: row.createdAt.toISOString(),
      }));
    },
  );
}

export async function reviewAttendanceCorrection(
  auth: AuthContext,
  input: {
    correctionId: string;
    decision: AttendanceCorrectionStatus;
    note?: string | null;
  },
): Promise<AttendanceCorrectionPayload> {
  if (input.decision !== "APPROVED" && input.decision !== "DENIED") {
    throw new ApiError(400, {
      code: "bad_request",
      message: "correction_review_invalid_decision",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "attendance:correction_review",
      abac: { minMfa: "standard", maxDataClassification: "internal" },
    },
    async (tx) => {
      const reviewerId = auth.subjectEmployeeId;
      if (!reviewerId) {
        throw new ApiError(403, {
          code: "forbidden",
          message: "employee_context_required",
        });
      }

      const row = await tx.attendanceCorrectionRequest.findFirst({
        where: { id: input.correctionId, tenantId: auth.tenantId },
        include: {
          employee: {
            select: {
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
          message: "correction_request_not_found",
        });
      }
      if (row.status !== "PENDING") {
        throw new ApiError(400, {
          code: "bad_request",
          message: "correction_already_decided",
        });
      }

      const decisionNote = input.note?.trim()
        ? input.note.trim().slice(0, 1000)
        : null;

      let appliedPunchId: string | null = null;

      if (input.decision === "APPROVED") {
        const applied = await applyApprovedCorrectionPunch(tx, auth.tenantId, {
          id: row.id,
          employeeId: row.employeeId,
          punchKind: row.punchKind,
          requestedOccurredAt: row.requestedOccurredAt,
        });
        appliedPunchId = applied.punchId;
      }

      const updated = await tx.attendanceCorrectionRequest.update({
        where: { id: row.id },
        data: {
          status: input.decision,
          decidedAt: new Date(),
          decidedByEmployeeId: reviewerId,
          decisionNote,
        },
        include: {
          employee: {
            select: {
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
        submittedByEmployeeId: updated.submittedByEmployeeId,
        punchKind: updated.punchKind,
        requestedOccurredAt: updated.requestedOccurredAt.toISOString(),
        reason: updated.reason,
        status: updated.status,
        decidedAt: updated.decidedAt ? updated.decidedAt.toISOString() : null,
        decisionNote: updated.decisionNote,
        createdAt: updated.createdAt.toISOString(),
        appliedPunchId,
      };
    },
  );
}

export async function listPendingAttendanceCorrectionsForHr(
  auth: AuthContext,
): Promise<AttendanceCorrectionPayload[]> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "attendance:correction_review",
      abac: { minMfa: "standard", maxDataClassification: "internal" },
    },
    async (tx) => {
      const rows = await tx.attendanceCorrectionRequest.findMany({
        where: { tenantId: auth.tenantId, status: "PENDING" },
        orderBy: [{ createdAt: "desc" }],
        take: 75,
        include: {
          employee: {
            select: {
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
        submittedByEmployeeId: row.submittedByEmployeeId,
        punchKind: row.punchKind,
        requestedOccurredAt: row.requestedOccurredAt.toISOString(),
        reason: row.reason,
        status: row.status,
        decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
        decisionNote: row.decisionNote,
        createdAt: row.createdAt.toISOString(),
      }));
    },
  );
}
