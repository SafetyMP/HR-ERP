import type { AuthContext } from "@/lib/security/auth-context";

/**
 * Local-only auth for analytics dashboard pages (never enable in production).
 * Prefer bearer JWT via `requireBearerAuth` for real traffic.
 */
export function demoHrAdminAuth(
  tenantId: string,
  correlationId = "analytics-demo",
): AuthContext {
  return {
    subjectId: "demo-analytics-subject",
    tenantId,
    roles: ["hr_admin"],
    mfaLevel: "standard",
    correlationId,
  };
}

export function isAnalyticsDemoMode(): boolean {
  return (
    process.env.ANALYTICS_DEMO_MODE === "1" &&
    process.env.NODE_ENV !== "production"
  );
}

export function requireDemoTenantId(): string {
  const id = process.env.DEMO_TENANT_ID?.trim();
  if (!id) throw new Error("DEMO_TENANT_ID is not set");
  return id;
}
