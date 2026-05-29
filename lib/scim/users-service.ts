import type { Employee, Prisma } from "@/app/generated/prisma/client";
import type { PrismaClient } from "@/app/generated/prisma/client";

import { isPrismaUniqueViolation } from "@/lib/prisma-errors";
import type { ScimTenantBinding } from "@/lib/scim/auth";
import { withScimTransaction } from "@/lib/scim/with-scim-transaction";
import type { ParsedScimUser } from "@/lib/scim/user-mapping";

async function upsertScimUserAccount(
  tx: Prisma.TransactionClient,
  tenantId: string,
  employeeId: string,
  email: string,
): Promise<void> {
  const existing = await tx.userAccount.findUnique({
    where: { tenantId_email: { tenantId, email } },
    select: { id: true },
  });
  if (existing) {
    await tx.userAccount.update({
      where: { id: existing.id },
      data: { employeeId },
    });
    return;
  }
  const account = await tx.userAccount.create({
    data: { tenantId, email, employeeId },
  });
  await tx.userRoleAssignment.create({
    data: { userId: account.id, role: "employee" },
  });
}

export async function listScimUsers(
  prisma: PrismaClient,
  binding: ScimTenantBinding,
  opts: { startIndex: number; count: number; userNameFilter: string | null },
): Promise<{ total: number; employees: Employee[] }> {
  const where = {
    tenantId: binding.tenantId,
    ...(opts.userNameFilter ? { email: opts.userNameFilter } : {}),
  };

  return withScimTransaction(prisma, binding, async (tx) => {
    const [total, employees] = await Promise.all([
      tx.employee.count({ where }),
      tx.employee.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip: opts.startIndex - 1,
        take: opts.count,
      }),
    ]);
    return { total, employees };
  });
}

export async function createScimUser(
  prisma: PrismaClient,
  binding: ScimTenantBinding,
  parsed: ParsedScimUser,
): Promise<Employee> {
  try {
    return await withScimTransaction(prisma, binding, async (tx) => {
      const employee = await tx.employee.create({
        data: {
          tenantId: binding.tenantId,
          email: parsed.email,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          status: parsed.active ? "ACTIVE" : "TERMINATED",
        },
      });
      await upsertScimUserAccount(
        tx,
        binding.tenantId,
        employee.id,
        parsed.email,
      );
      return employee;
    });
  } catch (err) {
    if (isPrismaUniqueViolation(err)) {
      throw new ScimUserAlreadyExistsError();
    }
    throw err;
  }
}

export async function getScimUserById(
  prisma: PrismaClient,
  binding: ScimTenantBinding,
  id: string,
): Promise<Employee | null> {
  return withScimTransaction(prisma, binding, async (tx) =>
    tx.employee.findFirst({
      where: { id, tenantId: binding.tenantId },
    }),
  );
}

export async function updateScimUser(
  prisma: PrismaClient,
  binding: ScimTenantBinding,
  id: string,
  parsed: ParsedScimUser,
): Promise<Employee | null> {
  return withScimTransaction(prisma, binding, async (tx) => {
    const existing = await tx.employee.findFirst({
      where: { id, tenantId: binding.tenantId },
      select: { id: true },
    });
    if (!existing) return null;
    const employee = await tx.employee.update({
      where: { id },
      data: {
        email: parsed.email,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        status: parsed.active ? "ACTIVE" : "TERMINATED",
      },
    });
    await upsertScimUserAccount(tx, binding.tenantId, employee.id, parsed.email);
    return employee;
  });
}

export async function patchScimUser(
  prisma: PrismaClient,
  binding: ScimTenantBinding,
  id: string,
  data: Record<string, unknown>,
): Promise<Employee | null> {
  return withScimTransaction(prisma, binding, async (tx) => {
    const existing = await tx.employee.findFirst({
      where: { id, tenantId: binding.tenantId },
    });
    if (!existing) return null;
    if (Object.keys(data).length === 0) return existing;
    return tx.employee.update({ where: { id }, data });
  });
}

export async function terminateScimUser(
  prisma: PrismaClient,
  binding: ScimTenantBinding,
  id: string,
): Promise<boolean> {
  return withScimTransaction(prisma, binding, async (tx) => {
    const existing = await tx.employee.findFirst({
      where: { id, tenantId: binding.tenantId },
      select: { id: true },
    });
    if (!existing) return false;
    await tx.employee.update({
      where: { id },
      data: { status: "TERMINATED", terminationDate: new Date() },
    });
    return true;
  });
}

export class ScimUserAlreadyExistsError extends Error {
  constructor() {
    super("user_already_exists");
    this.name = "ScimUserAlreadyExistsError";
  }
}
