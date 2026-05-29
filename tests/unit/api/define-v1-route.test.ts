import { describe, expect, it } from "vitest";
import { z } from "zod";

import { defineV1Route } from "@/lib/api/v1/define-v1-route";

describe("defineV1Route", () => {
  it("exports a handler function", () => {
    const GET = defineV1Route({
      method: "GET",
      pathname: "/api/v1/me/profile",
      handler: async () => ({ ok: true }),
    });
    expect(typeof GET).toBe("function");
  });

  it("accepts optional body schema type", () => {
    const schema = z.object({ name: z.string() });
    const PATCH = defineV1Route({
      method: "PATCH",
      pathname: "/api/v1/me/profile",
      bodySchema: schema,
      handler: async ({ body }) => ({ name: body.name }),
    });
    expect(typeof PATCH).toBe("function");
  });
});
