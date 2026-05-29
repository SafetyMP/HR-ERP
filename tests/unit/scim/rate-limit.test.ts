import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/v1/errors";
import {
  assertScimRateLimit,
  resetScimRateLimitsForTests,
} from "@/lib/scim/rate-limit";

describe("SCIM rate limit", () => {
  it("allows requests under the limit", () => {
    resetScimRateLimitsForTests();
    expect(() => assertScimRateLimit("tenant-test")).not.toThrow();
  });

  it("returns 429 when limit exceeded", () => {
    resetScimRateLimitsForTests();
    const tenant = "tenant-heavy";
    for (let i = 0; i < 120; i++) {
      assertScimRateLimit(tenant);
    }
    expect(() => assertScimRateLimit(tenant)).toThrow(ApiError);
    try {
      assertScimRateLimit(tenant);
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(429);
    }
  });
});
