import type { CatalogStatus, Prisma } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type DepartmentClosed = {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
};

const departmentSelect = {
  id: true,
  name: true,
  code: true,
  parentId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DepartmentSelect;

export function toDepartmentClosed(row: {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  status: CatalogStatus;
  createdAt: Date;
  updatedAt: Date;
}): DepartmentClosed {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    parentId: row.parentId,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type CreateDepartmentInput = {
  name: string;
  code: string;
  parentId?: string | null;
  status?: CatalogStatus;
};

async function assertValidParent(
  tx: Prisma.TransactionClient,
  tenantId: string,
  parentId: string,
): Promise<void> {
  const parent = await tx.department.findFirst({
    where: { id: parentId, tenantId },
    select: { id: true, parentId: true },
  });
  if (!parent) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "invalid_parent_department",
    });
  }

  // Walk ancestors to detect an existing cycle in the forest (defensive).
  const seen = new Set<string>([parentId]);
  let cursor: string | null = parent.parentId;
  while (cursor) {
    if (seen.has(cursor)) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "department_parent_cycle",
      });
    }
    seen.add(cursor);
    const next: { parentId: string | null } | null = await tx.department.findFirst({
      where: { id: cursor, tenantId },
      select: { parentId: true },
    });
    if (!next) break;
    cursor = next.parentId;
  }
}

export async function createDepartment(
  auth: AuthContext,
  input: CreateDepartmentInput,
): Promise<DepartmentClosed> {
  const name = input.name.trim();
  const code = input.code.trim();
  if (!name || !code) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "name_and_code_required",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "departments:write",
      resourceClassification: "internal",
    },
    async (tx) => {
      const parentId = input.parentId ?? null;
      if (parentId) {
        await assertValidParent(tx, auth.tenantId, parentId);
      }

      try {
        const row = await tx.department.create({
          data: {
            tenantId: auth.tenantId,
            name,
            code,
            parentId,
            status: input.status ?? "ACTIVE",
          },
          select: departmentSelect,
        });
        return toDepartmentClosed(row);
      } catch (err: unknown) {
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: string }).code === "P2002"
        ) {
          throw new ApiError(409, {
            code: "conflict",
            message: "department_unique_violation",
          });
        }
        throw err;
      }
    },
  );
}

export async function listDepartments(auth: AuthContext): Promise<DepartmentClosed[]> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "departments:read",
      resourceClassification: "internal",
    },
    async (tx) => {
      const rows = await tx.department.findMany({
        orderBy: { id: "asc" },
        select: departmentSelect,
      });
      return rows.map(toDepartmentClosed);
    },
  );
}

export async function getDepartment(
  auth: AuthContext,
  departmentId: string,
): Promise<DepartmentClosed> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "departments:read",
      resourceClassification: "internal",
    },
    async (tx) => {
      const row = await tx.department.findFirst({
        where: { id: departmentId },
        select: departmentSelect,
      });
      if (!row) {
        throw new ApiError(404, {
          code: "not_found",
          message: "department_not_found",
        });
      }
      return toDepartmentClosed(row);
    },
  );
}
