import type { EmployeeStatus, Prisma } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

const EMPLOYEE_CACHE_PREFIX = "hrerp:v1:employee:";

async function invalidateEmployeeCache(tenantId: string, employeeId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(`${EMPLOYEE_CACHE_PREFIX}${tenantId}:${employeeId}`);
}

export type EmployeeClosed = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  preferredName: string | null;
  departmentId: string | null;
  jobRoleId: string | null;
  managerId: string | null;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
};

const employeeSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  preferredName: true,
  departmentId: true,
  jobRoleId: true,
  managerId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EmployeeSelect;

export function toEmployeeClosed(row: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  preferredName: string | null;
  departmentId: string | null;
  jobRoleId: string | null;
  managerId: string | null;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
}): EmployeeClosed {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    preferredName: row.preferredName,
    departmentId: row.departmentId,
    jobRoleId: row.jobRoleId,
    managerId: row.managerId,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type CreateEmployeeInput = {
  email: string;
  departmentId: string;
  jobRoleId: string;
  firstName?: string | null;
  lastName?: string | null;
  preferredName?: string | null;
  managerId?: string | null;
  status?: EmployeeStatus;
};

export type PatchEmployeeInput = {
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  preferredName?: string | null;
  departmentId?: string;
  jobRoleId?: string;
  managerId?: string | null;
  status?: EmployeeStatus;
};

async function assertActiveDepartment(
  tx: Prisma.TransactionClient,
  tenantId: string,
  departmentId: string,
): Promise<void> {
  const dept = await tx.department.findFirst({
    where: { id: departmentId, tenantId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!dept) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "invalid_department_reference",
    });
  }
}

async function assertActiveJobRole(
  tx: Prisma.TransactionClient,
  tenantId: string,
  jobRoleId: string,
): Promise<void> {
  const role = await tx.jobRole.findFirst({
    where: { id: jobRoleId, tenantId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!role) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "invalid_job_role_reference",
    });
  }
}

async function assertValidManager(
  tx: Prisma.TransactionClient,
  tenantId: string,
  managerId: string,
  employeeId?: string,
): Promise<void> {
  if (employeeId && managerId === employeeId) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "invalid_manager_reference",
    });
  }
  const manager = await tx.employee.findFirst({
    where: { id: managerId, tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!manager) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "invalid_manager_reference",
    });
  }
}

export async function createEmployee(
  auth: AuthContext,
  input: CreateEmployeeInput,
): Promise<EmployeeClosed> {
  const email = input.email.trim().toLowerCase();
  if (!email) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "email_required",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "employees:write",
      resourceClassification: "confidential",
    },
    async (tx) => {
      await assertActiveDepartment(tx, auth.tenantId, input.departmentId);
      await assertActiveJobRole(tx, auth.tenantId, input.jobRoleId);
      if (input.managerId) {
        await assertValidManager(tx, auth.tenantId, input.managerId);
      }

      try {
        const row = await tx.employee.create({
          data: {
            tenantId: auth.tenantId,
            email,
            departmentId: input.departmentId,
            jobRoleId: input.jobRoleId,
            firstName: input.firstName?.trim() || null,
            lastName: input.lastName?.trim() || null,
            preferredName: input.preferredName?.trim() || null,
            managerId: input.managerId ?? null,
            status: input.status ?? "ACTIVE",
          },
          select: employeeSelect,
        });
        return toEmployeeClosed(row);
      } catch (err: unknown) {
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: string }).code === "P2002"
        ) {
          throw new ApiError(409, {
            code: "conflict",
            message: "employee_unique_violation",
          });
        }
        throw err;
      }
    },
  );
}

export async function patchEmployee(
  auth: AuthContext,
  employeeId: string,
  input: PatchEmployeeInput,
): Promise<EmployeeClosed> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "employees:write",
      resourceClassification: "confidential",
    },
    async (tx) => {
      const existing = await tx.employee.findFirst({
        where: { id: employeeId, deletedAt: null },
        select: { id: true },
      });
      if (!existing) {
        throw new ApiError(404, {
          code: "not_found",
          message: "employee_not_found",
        });
      }

      if (input.departmentId !== undefined) {
        await assertActiveDepartment(tx, auth.tenantId, input.departmentId);
      }
      if (input.jobRoleId !== undefined) {
        await assertActiveJobRole(tx, auth.tenantId, input.jobRoleId);
      }
      if (input.managerId) {
        await assertValidManager(tx, auth.tenantId, input.managerId, employeeId);
      }

      const data: Prisma.EmployeeUncheckedUpdateInput = {};
      if (input.email !== undefined) data.email = input.email.trim().toLowerCase();
      if (input.firstName !== undefined) data.firstName = input.firstName?.trim() || null;
      if (input.lastName !== undefined) data.lastName = input.lastName?.trim() || null;
      if (input.preferredName !== undefined) {
        data.preferredName = input.preferredName?.trim() || null;
      }
      if (input.departmentId !== undefined) data.departmentId = input.departmentId;
      if (input.jobRoleId !== undefined) data.jobRoleId = input.jobRoleId;
      if (input.managerId !== undefined) data.managerId = input.managerId;
      if (input.status !== undefined) data.status = input.status;

      try {
        const row = await tx.employee.update({
          where: { id: employeeId },
          data,
          select: employeeSelect,
        });
        await invalidateEmployeeCache(auth.tenantId, employeeId);
        return toEmployeeClosed(row);
      } catch (err: unknown) {
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: string }).code === "P2002"
        ) {
          throw new ApiError(409, {
            code: "conflict",
            message: "employee_unique_violation",
          });
        }
        throw err;
      }
    },
  );
}

export async function listEmployeesClosed(
  auth: AuthContext,
  filters: { departmentId?: string; jobRoleId?: string },
): Promise<EmployeeClosed[]> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "employees:list",
      resourceClassification: "confidential",
    },
    async (tx) => {
      const rows = await tx.employee.findMany({
        where: {
          deletedAt: null,
          ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
          ...(filters.jobRoleId ? { jobRoleId: filters.jobRoleId } : {}),
        },
        orderBy: { id: "asc" },
        take: 100,
        select: employeeSelect,
      });
      return rows.map(toEmployeeClosed);
    },
  );
}

export async function getEmployeeClosed(
  auth: AuthContext,
  employeeId: string,
): Promise<EmployeeClosed> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "employees:read",
      resourceClassification: "internal",
    },
    async (tx) => {
      const row = await tx.employee.findFirst({
        where: { id: employeeId, deletedAt: null },
        select: employeeSelect,
      });
      if (!row) {
        throw new ApiError(404, {
          code: "not_found",
          message: "employee_not_found",
        });
      }
      return toEmployeeClosed(row);
    },
  );
}
