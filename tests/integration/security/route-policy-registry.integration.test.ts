import { describe, expect, it } from "vitest";

import { getRoutePolicy } from "@/lib/security/route-policies";

describe("route policy registry (integration smoke)", () => {
  it("covers employee self-service routes used in e2e", () => {
    const routes: Array<[string, string]> = [
      ["GET", "/api/v1/me/paystub/current"],
      ["GET", "/api/v1/me/profile"],
      ["GET", "/api/v1/me/pto/summary"],
      ["POST", "/api/v1/me/time-off/requests"],
      ["GET", "/api/v1/payroll/runs"],
    ];
    for (const [method, path] of routes) {
      expect(getRoutePolicy(method as "GET", path)).toBeDefined();
    }
  });
});
