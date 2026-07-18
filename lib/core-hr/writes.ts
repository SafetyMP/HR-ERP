import type { Employee, EmployeeStatus, Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { withTenantTransaction } from "@/lib/security/with-tenant-transaction";

/**
 * Single-writer facade for Core HR aggregates (Employee, Organization).
 * Integrations and self-profile must route mutations through this module.
 * SCIM remains a dedicated IdP writer (`lib/scim/users-service`) until migrated.
 */

export async function ensureOrganization(
  tenantId: string,
  name?: string,
): Promise<void> {
  await withTenantTransaction(prisma, tenantId, async (tx) => {
    await tx.organization.upsert({
      where: { id: tenantId },
      create: {
        id: tenantId,
        name: name?.trim() || `Tenant ${tenantId}`,
      },
      update: {},
    });
  });
}

export type UpsertEmployeeInput = {
  tenantId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status?: EmployeeStatus;
};

export async function upsertEmployeeByEmail(
  input: UpsertEmployeeInput,
): Promise<{ id: string; email: string; tenantId: string }> {
  return withTenantTransaction(prisma, input.tenantId, async (tx) => {
    return upsertEmployeeByEmailInTx(tx, input);
  });
}

export async function upsertEmployeeVendorLink(input: {
  tenantId: string;
  employeeId: string;
  vendorKey: string;
  externalId: string;
}): Promise<void> {
  await withTenantTransaction(prisma, input.tenantId, async (tx) => {
    await tx.employeeVendorLink.upsert({
      where: {
        employeeId_vendorKey: {
          employeeId: input.employeeId,
          vendorKey: input.vendorKey,
        },
      },
      create: {
        tenantId: input.tenantId,
        employeeId: input.employeeId,
        vendorKey: input.vendorKey,
        externalId: input.externalId,
      },
      update: { externalId: input.externalId },
    });
  });
}

/** Escape hatch for callers that already hold a tenant-scoped transaction. */
export async function upsertEmployeeByEmailInTx(
  tx: Prisma.TransactionClient,
  input: UpsertEmployeeInput,
): Promise<{ id: string; email: string; tenantId: string }> {
  return tx.employee.upsert({
    where: {
      tenantId_email: { tenantId: input.tenantId, email: input.email },
    },
    create: {
      tenantId: input.tenantId,
      email: input.email,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    update: {
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    select: { id: true, email: true, tenantId: true },
  });
}

/** Self-service / authorized profile fields — use from an already tenant-scoped TX. */
export async function updateEmployeeInTx(
  tx: Prisma.TransactionClient,
  employeeId: string,
  data: Prisma.EmployeeUpdateInput,
): Promise<Employee> {
  return tx.employee.update({
    where: { id: employeeId },
    data,
  });
}

/**
 * Self-service / authorized profile field updates. Callers must already hold a
 * tenant-scoped authorized transaction (RLS + RBAC).
 */
export async function updateEmployeeFieldsInTx(
  tx: Prisma.TransactionClient,
  employeeId: string,
  data: Prisma.EmployeeUpdateInput,
) {
  return tx.employee.update({
    where: { id: employeeId },
    data,
  });
}
