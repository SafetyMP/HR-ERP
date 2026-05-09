import { describe, expect, it } from "vitest";

import { verifyBearerIssuerSecret } from "@/lib/security/bearer-issuer";

describe("verifyBearerIssuerSecret", () => {
  const secret = "x".repeat(32);

  it("accepts matching Bearer secret", () => {
    expect(
      verifyBearerIssuerSecret(`Bearer ${secret}`, secret),
    ).toBe(true);
  });

  it("rejects wrong secret", () => {
    expect(
      verifyBearerIssuerSecret(`Bearer ${"y".repeat(32)}`, secret),
    ).toBe(false);
  });

  it("rejects missing Bearer prefix", () => {
    expect(verifyBearerIssuerSecret(secret, secret)).toBe(false);
  });

  it("rejects short expected secret", () => {
    expect(
      verifyBearerIssuerSecret("Bearer abc", "short"),
    ).toBe(false);
  });

  it("rejects missing expected secret", () => {
    expect(
      verifyBearerIssuerSecret(`Bearer ${secret}`, undefined),
    ).toBe(false);
  });
});
