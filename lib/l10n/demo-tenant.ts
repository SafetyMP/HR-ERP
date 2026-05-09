/**
 * Tenant id shared by demo tooling and seeded organizations.
 */
export function getDemoTenantId(): string {
  return (
    process.env.DEMO_TENANT_ID ??
    process.env.NEXT_PUBLIC_DEMO_TENANT_ID ??
    "default-tenant"
  );
}
