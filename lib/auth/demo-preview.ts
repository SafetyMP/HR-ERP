import type { Role } from "@/lib/security/permissions";
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
 * Enabled automatically on Vercel Preview and local dev. Production requires
 * ALLOW_DEMO_PREVIEW_SIGNIN=1 and ALLOW_DEMO_PREVIEW_ON_PRODUCTION=1.
 * Set DISABLE_DEMO_PREVIEW_SIGNIN=1 to opt out on Preview.
 */
export function demoPreviewSignInServerEnabled(): boolean {
  if (process.env.DISABLE_DEMO_PREVIEW_SIGNIN === "1") return false;

  if (process.env.VERCEL_ENV === "preview") return true;
  if (process.env.NODE_ENV !== "production") return true;

  if (process.env.ALLOW_DEMO_PREVIEW_SIGNIN !== "1") return false;

  if (process.env.VERCEL_ENV === "production") {
    return process.env.ALLOW_DEMO_PREVIEW_ON_PRODUCTION === "1";
  }

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
