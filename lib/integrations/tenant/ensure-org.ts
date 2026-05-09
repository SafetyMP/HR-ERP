import { prisma } from "@/lib/prisma";

/**
 * `Employee.tenant_id` must reference `Organization.id` — provision a minimal org stub for demo tenants.
 */
export async function ensureTenantOrganization(tenantId: string): Promise<void> {
  await prisma.organization.upsert({
    where: { id: tenantId },
    create: {
      id: tenantId,
      name: `Tenant ${tenantId}`,
    },
    update: {},
  });
}
