import { afterEach, describe, expect, it, vi } from "vitest";

import { assertProductionJwtIssuerMode } from "@/lib/security/assert-production-jwt-mode";

describe("assertProductionJwtIssuerMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("no-ops outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("JWT_ISSUER_MODE", "hs256");
    expect(() => assertProductionJwtIssuerMode()).not.toThrow();
  });

  it("fails production hs256 without break-glass", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("ALLOW_HS256_IN_PRODUCTION", "");
    vi.stubEnv("JWT_ISSUER_MODE", "hs256");
    expect(() => assertProductionJwtIssuerMode()).toThrow(/jwks or oidc/);
  });

  it("allows jwks in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_ISSUER_MODE", "jwks");
    expect(() => assertProductionJwtIssuerMode()).not.toThrow();
  });
});
