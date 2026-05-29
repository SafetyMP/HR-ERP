import { describe, expect, it } from "vitest";

import { getRoutePolicy } from "@/lib/security/route-policies";

describe("recruiting route policies", () => {
  it("registers requisition list and create policies", () => {
    expect(getRoutePolicy("GET", "/api/v1/recruiting/requisitions")?.permission).toBe(
      "recruiting:requisition_read",
    );
    expect(getRoutePolicy("POST", "/api/v1/recruiting/requisitions")?.permission).toBe(
      "recruiting:requisition_write",
    );
  });
});
