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

  it("registers requisition get-by-id policy", () => {
    const id = "b0000001-0001-4000-8000-000000000099";
    expect(
      getRoutePolicy("GET", `/api/v1/recruiting/requisitions/${id}`)?.permission,
    ).toBe("recruiting:requisition_read");
  });
});
