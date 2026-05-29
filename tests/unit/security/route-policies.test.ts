import { describe, expect, it } from "vitest";

import { getRoutePolicy } from "@/lib/security/route-policies";

describe("route-policies", () => {
  it("returns policy for registered v1 routes", () => {
    const policy = getRoutePolicy("GET", "/api/v1/me/profile");
    expect(policy?.permission).toBe("employees:read");
  });

  it("returns undefined for unknown routes (deny-by-default)", () => {
    expect(getRoutePolicy("GET", "/api/v1/unknown/route")).toBeUndefined();
  });
});
