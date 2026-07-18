import { ensureOrganization } from "@/lib/core-hr/writes";

/**
 * `Employee.tenant_id` must reference `Organization.id` — provision a minimal org stub for demo tenants.
 */
export async function ensureTenantOrganization(tenantId: string): Promise<void> {
  await ensureOrganization(tenantId);
}
