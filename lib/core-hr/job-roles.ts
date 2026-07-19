import type { CatalogStatus, Prisma } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type JobRoleClosed = {
  id: string;
  title: string;
  level: string | null;
  departmentId: string | null;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
};

const jobRoleSelect = {
  id: true,
  title: true,
  level: true,
  departmentId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.JobRoleSelect;

export function toJobRoleClosed(row: {
  id: string;
  title: string;
  level: string | null;
  departmentId: string | null;
  status: CatalogStatus;
  createdAt: Date;
  updatedAt: Date;
}): JobRoleClosed {
  return {
    id: row.id,
    title: row.title,
    level: row.level,
    departmentId: row.departmentId,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type CreateJobRoleInput = {
  title: string;
  level?: string | null;
  departmentId?: string | null;
  status?: CatalogStatus;
};

export async function createJobRole(
  auth: AuthContext,
  input: CreateJobRoleInput,
): Promise<JobRoleClosed> {
  const title = input.title.trim();
  if (!title) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "title_required",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "job_roles:write",
      resourceClassification: "internal",
    },
    async (tx) => {
      const departmentId = input.departmentId ?? null;
      if (departmentId) {
        const dept = await tx.department.findFirst({
          where: { id: departmentId, tenantId: auth.tenantId, status: "ACTIVE" },
          select: { id: true },
        });
        if (!dept) {
          throw new ApiError(400, {
            code: "validation_error",
            message: "invalid_department_reference",
          });
        }
      }

      try {
        const row = await tx.jobRole.create({
          data: {
            tenantId: auth.tenantId,
            title,
            level: input.level?.trim() || null,
            departmentId,
            status: input.status ?? "ACTIVE",
          },
          select: jobRoleSelect,
        });
        return toJobRoleClosed(row);
      } catch (err: unknown) {
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: string }).code === "P2002"
        ) {
          throw new ApiError(409, {
            code: "conflict",
            message: "job_role_unique_violation",
          });
        }
        throw err;
      }
    },
  );
}

export async function listJobRoles(auth: AuthContext): Promise<JobRoleClosed[]> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "job_roles:read",
      resourceClassification: "internal",
    },
    async (tx) => {
      const rows = await tx.jobRole.findMany({
        orderBy: { id: "asc" },
        select: jobRoleSelect,
      });
      return rows.map(toJobRoleClosed);
    },
  );
}

export async function getJobRole(
  auth: AuthContext,
  jobRoleId: string,
): Promise<JobRoleClosed> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "job_roles:read",
      resourceClassification: "internal",
    },
    async (tx) => {
      const row = await tx.jobRole.findFirst({
        where: { id: jobRoleId },
        select: jobRoleSelect,
      });
      if (!row) {
        throw new ApiError(404, {
          code: "not_found",
          message: "job_role_not_found",
        });
      }
      return toJobRoleClosed(row);
    },
  );
}
