import type { HrCaseCategory, HrCaseStatus } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type HrCaseListItemPayload = {
  id: string;
  category: HrCaseCategory;
  status: HrCaseStatus;
  bodyPreview: string;
  employeeVisibleNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listMyHrCaseRequests(auth: AuthContext): Promise<HrCaseListItemPayload[]> {
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
      permission: "case:intake_read",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const rows = await tx.hrCaseRequest.findMany({
        where: { tenantId: auth.tenantId, employeeId },
        orderBy: [{ createdAt: "desc" }],
        take: 50,
      });

      return rows.map((row) => ({
        id: row.id,
        category: row.category,
        status: row.status,
        bodyPreview: row.body.slice(0, 160) + (row.body.length > 160 ? "…" : ""),
        employeeVisibleNote: row.employeeVisibleNote,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    },
  );
}

export type HrCaseReviewRowPayload = {
  id: string;
  employeeId: string;
  employeeDisplayName: string;
  category: HrCaseCategory;
  status: HrCaseStatus;
  body: string;
  employeeVisibleNote: string | null;
  createdAt: string;
};

function displayName(e: {
  preferredName: string | null;
  firstName: string | null;
  lastName: string | null;
}): string {
  const pref = e.preferredName?.trim();
  if (pref) return pref;
  const parts = [e.firstName?.trim(), e.lastName?.trim()].filter(Boolean);
  return parts.length ? parts.join(" ") : "Employee";
}

export async function listHrCasesForReview(auth: AuthContext): Promise<HrCaseReviewRowPayload[]> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "case:hr_triage",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const rows = await tx.hrCaseRequest.findMany({
        where: {
          tenantId: auth.tenantId,
          status: { in: ["OPEN", "ACKNOWLEDGED", "NEEDS_INFO"] },
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 75,
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
        category: row.category,
        status: row.status,
        body: row.body,
        employeeVisibleNote: row.employeeVisibleNote,
        createdAt: row.createdAt.toISOString(),
      }));
    },
  );
}

export async function reviewHrCaseRequest(
  auth: AuthContext,
  input: { requestId: string; status: HrCaseStatus; employeeVisibleNote?: string | null },
): Promise<HrCaseListItemPayload> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "case:hr_triage",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const row = await tx.hrCaseRequest.findFirst({
        where: { id: input.requestId, tenantId: auth.tenantId },
      });
      if (!row) {
        throw new ApiError(404, {
          code: "not_found",
          message: "hr_case_not_found",
        });
      }

      const note =
        input.employeeVisibleNote === undefined
          ? row.employeeVisibleNote
          : input.employeeVisibleNote?.trim()
            ? input.employeeVisibleNote.trim().slice(0, 1000)
            : null;

      const updated = await tx.hrCaseRequest.update({
        where: { id: row.id },
        data: {
          status: input.status,
          employeeVisibleNote: note,
        },
      });

      return {
        id: updated.id,
        category: updated.category,
        status: updated.status,
        bodyPreview: updated.body.slice(0, 160) + (updated.body.length > 160 ? "…" : ""),
        employeeVisibleNote: updated.employeeVisibleNote,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    },
  );
}
