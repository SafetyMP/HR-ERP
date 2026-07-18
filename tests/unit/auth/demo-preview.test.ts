import { afterEach, describe, expect, it, vi } from "vitest";

import {
  demoPreviewBootstrapHref,
  demoPreviewLandingEnabled,
  demoPreviewSignInUiEnabled,
  parseDemoPreviewPersona,
} from "@/lib/auth/demo-preview-config";
import { switchAccountRedirectTarget } from "@/lib/auth/switch-account";
import {
  demoPreviewSignInServerEnabled,
  demoPreviewTenantId,
} from "@/lib/auth/demo-preview";

describe("demo-preview", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses allowed personas", () => {
    expect(parseDemoPreviewPersona("employee")).toBe("employee");
    expect(parseDemoPreviewPersona("manager")).toBe("manager");
    expect(parseDemoPreviewPersona("hr")).toBe("hr");
    expect(parseDemoPreviewPersona("admin")).toBeNull();
  });

  it("builds bootstrap href with returnTo", () => {
    expect(demoPreviewBootstrapHref("employee", "/employee/paystub")).toBe(
      "/api/auth/demo-preview?persona=employee&returnTo=%2Femployee%2Fpaystub",
    );
  });

  it("requires opt-in on Vercel Preview", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NODE_ENV", "production");
    expect(demoPreviewSignInServerEnabled()).toBe(false);
    vi.stubEnv("ALLOW_DEMO_PREVIEW_SIGNIN", "1");
    expect(demoPreviewSignInServerEnabled()).toBe(true);
  });

  it("enables server gate automatically in local development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(demoPreviewSignInServerEnabled()).toBe(true);
  });

  it("can disable server gate on preview with DISABLE_DEMO_PREVIEW_SIGNIN", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_DEMO_PREVIEW_SIGNIN", "1");
    vi.stubEnv("DISABLE_DEMO_PREVIEW_SIGNIN", "1");
    expect(demoPreviewSignInServerEnabled()).toBe(false);
  });

  it("blocks server gate on production by default", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    expect(demoPreviewSignInServerEnabled()).toBe(false);
  });

  it("allows server gate on production with explicit break-glass flags", () => {
    vi.stubEnv("ALLOW_DEMO_PREVIEW_SIGNIN", "1");
    vi.stubEnv("ALLOW_DEMO_PREVIEW_ON_PRODUCTION", "1");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    expect(demoPreviewSignInServerEnabled()).toBe(true);
  });

  it("requires dual break-glass on Docker/self-host production (no VERCEL_ENV)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("ALLOW_DEMO_PREVIEW_SIGNIN", "1");
    expect(demoPreviewSignInServerEnabled()).toBe(false);
    vi.stubEnv("ALLOW_DEMO_PREVIEW_ON_PRODUCTION", "1");
    expect(demoPreviewSignInServerEnabled()).toBe(true);
  });

  it("enables UI gate from NEXT_PUBLIC_DEMO_PREVIEW_SIGNIN", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_PREVIEW_SIGNIN", "true");
    expect(demoPreviewSignInUiEnabled()).toBe(true);
  });

  it("enables demo landing routing on Vercel Preview", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    expect(demoPreviewLandingEnabled()).toBe(true);
  });

  it("sends switch-account to home on Preview instead of OAuth login", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    expect(switchAccountRedirectTarget()).toBe("/");
  });

  it("resolves demo tenant id", () => {
    vi.stubEnv("DEMO_TENANT_ID", "tenant-a");
    expect(demoPreviewTenantId()).toBe("tenant-a");
  });
});

describe("demo-preview routes", () => {
  it("imports bootstrap route", async () => {
    const mod = await import("@/app/api/auth/demo-preview/route");
    expect(typeof mod.GET).toBe("function");
  });

  it("imports status route", async () => {
    const mod = await import("@/app/api/auth/demo-preview/status/route");
    expect(typeof mod.GET).toBe("function");
  });
});
