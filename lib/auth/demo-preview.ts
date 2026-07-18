import { signHrAccessToken } from "@/lib/security/jwt";

import {
  DEMO_PREVIEW_PERSONAS,
  type DemoPreviewPersona,
} from "@/lib/auth/demo-preview-config";

export {
  DEMO_PREVIEW_PERSONAS,
  demoPreviewBootstrapHref,
  demoPreviewSignInUiEnabled,
  parseDemoPreviewPersona,
  type DemoPreviewPersona,
} from "@/lib/auth/demo-preview-config";

export function demoPreviewTenantId(): string {
  return (
    process.env.DEMO_TENANT_ID?.trim() ||
    process.env.NEXT_PUBLIC_DEMO_TENANT_ID?.trim() ||
    "default-tenant"
  );
}

/**
 * Server gate: one-click demo sessions.
 *
 * Local/dev: enabled unless DISABLE_DEMO_PREVIEW_SIGNIN=1.
 * Vercel Preview: opt-in via ALLOW_DEMO_PREVIEW_SIGNIN=1 (Deployment Protection recommended).
 * Production-like hosts (VERCEL_ENV=production OR NODE_ENV=production without Preview):
 * requires ALLOW_DEMO_PREVIEW_SIGNIN=1 and ALLOW_DEMO_PREVIEW_ON_PRODUCTION=1.
 */
export function demoPreviewSignInServerEnabled(): boolean {
  if (process.env.DISABLE_DEMO_PREVIEW_SIGNIN === "1") return false;

  const vercelEnv = process.env.VERCEL_ENV?.trim();
  const isPreview = vercelEnv === "preview";
  const isVercelProduction = vercelEnv === "production";
  const isNodeProduction = process.env.NODE_ENV === "production";
  // Self-host / Docker: NODE_ENV=production with no VERCEL_ENV must not skip the second gate.
  const isProductionLike =
    isVercelProduction || (isNodeProduction && !isPreview);

  if (!isProductionLike && !isPreview) {
    return true;
  }

  if (process.env.ALLOW_DEMO_PREVIEW_SIGNIN !== "1") return false;

  if (isProductionLike) {
    return process.env.ALLOW_DEMO_PREVIEW_ON_PRODUCTION === "1";
  }

  // Vercel Preview: single opt-in flag.
  return true;
}

export async function mintDemoPreviewAccessToken(
  persona: DemoPreviewPersona,
): Promise<string> {
  const spec = DEMO_PREVIEW_PERSONAS[persona];
  return signHrAccessToken({
    sub: spec.subjectId,
    tenantId: demoPreviewTenantId(),
    roles: [...spec.roles],
    ...("subjectEmployeeId" in spec && spec.subjectEmployeeId
      ? { subjectEmployeeId: spec.subjectEmployeeId }
      : {}),
    mfaLevel: "standard",
    expiresIn: "2h",
  });
}
