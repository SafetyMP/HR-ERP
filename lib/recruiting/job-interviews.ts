import type { JobInterviewOutcome, Prisma } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export async function listJobInterviews(auth: AuthContext, applicationId: string) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "recruiting:application_read",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const app = await tx.jobApplication.findFirst({
        where: { id: applicationId, tenantId: auth.tenantId },
        select: { id: true },
      });
      if (!app) {
        throw new ApiError(404, {
          code: "not_found",
          message: "application_not_found",
        });
      }
      const rows = await tx.jobInterview.findMany({
        where: { applicationId, tenantId: auth.tenantId },
        orderBy: { scheduledAt: "asc" },
      });
      return rows.map(serializeInterview);
    },
  );
}

export async function createJobInterview(
  auth: AuthContext,
  applicationId: string,
  input: {
    scheduledAt: string;
    interviewType: string;
  },
) {
  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "invalid_scheduled_at",
    });
  }
  const interviewType = input.interviewType.trim().slice(0, 120);
  if (!interviewType) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "interview_type_required",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "recruiting:application_write",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const app = await tx.jobApplication.findFirst({
        where: { id: applicationId, tenantId: auth.tenantId },
        select: { id: true },
      });
      if (!app) {
        throw new ApiError(404, {
          code: "not_found",
          message: "application_not_found",
        });
      }

      const row = await tx.jobInterview.create({
        data: {
          tenantId: auth.tenantId,
          applicationId,
          scheduledAt,
          interviewType,
          outcome: "SCHEDULED",
        },
      });
      return serializeInterview(row);
    },
  );
}

export async function updateJobInterview(
  auth: AuthContext,
  interviewId: string,
  input: {
    outcome?: JobInterviewOutcome;
    scorecardJson?: Record<string, unknown>;
  },
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "recruiting:application_write",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const row = await tx.jobInterview.findFirst({
        where: { id: interviewId, tenantId: auth.tenantId },
      });
      if (!row) {
        throw new ApiError(404, {
          code: "not_found",
          message: "interview_not_found",
        });
      }

      const data: Prisma.JobInterviewUpdateInput = {
        outcome: input.outcome ?? row.outcome,
      };
      if (input.scorecardJson !== undefined) {
        data.scorecardJson = input.scorecardJson as Prisma.InputJsonValue;
      }

      const updated = await tx.jobInterview.update({
        where: { id: row.id },
        data,
      });
      return serializeInterview(updated);
    },
  );
}

function serializeInterview(row: {
  id: string;
  applicationId: string;
  scheduledAt: Date;
  interviewType: string;
  outcome: JobInterviewOutcome;
  scorecardJson: unknown;
}) {
  return {
    id: row.id,
    applicationId: row.applicationId,
    scheduledAt: row.scheduledAt.toISOString(),
    interviewType: row.interviewType,
    outcome: row.outcome,
    scorecardJson: row.scorecardJson,
  };
}
