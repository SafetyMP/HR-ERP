import { afterEach, describe, expect, it, vi } from "vitest";

import {
  demoPreviewBootstrapHref,
  demoPreviewSignInUiEnabled,
  parseDemoPreviewPersona,
} from "@/lib/auth/demo-preview-config";
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

  it("enables server gate automatically on Vercel Preview", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NODE_ENV", "production");
    expect(demoPreviewSignInServerEnabled()).toBe(true);
  });

  it("enables server gate automatically in local development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(demoPreviewSignInServerEnabled()).toBe(true);
  });

  it("can disable server gate on preview with DISABLE_DEMO_PREVIEW_SIGNIN", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NODE_ENV", "production");
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

  it("enables UI gate from NEXT_PUBLIC_DEMO_PREVIEW_SIGNIN", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_PREVIEW_SIGNIN", "true");
    expect(demoPreviewSignInUiEnabled()).toBe(true);
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
