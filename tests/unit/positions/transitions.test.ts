import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/v1/errors";
import { assertValidPositionTransition } from "@/lib/positions/positions";

describe("assertValidPositionTransition", () => {
  it("walks the canonical lifecycle", () => {
    expect(() => assertValidPositionTransition("PROPOSED", "APPROVED")).not.toThrow();
    expect(() => assertValidPositionTransition("APPROVED", "ACTIVE")).not.toThrow();
    expect(() => assertValidPositionTransition("ACTIVE", "FROZEN")).not.toThrow();
    expect(() => assertValidPositionTransition("FROZEN", "ACTIVE")).not.toThrow();
    expect(() => assertValidPositionTransition("ACTIVE", "CLOSED")).not.toThrow();
  });

  it("permits cancelling a PROPOSED position", () => {
    expect(() => assertValidPositionTransition("PROPOSED", "CLOSED")).not.toThrow();
  });

  it("blocks rewinding past CLOSED or skipping APPROVED", () => {
    expect(() => assertValidPositionTransition("CLOSED", "ACTIVE")).toThrow(ApiError);
    expect(() => assertValidPositionTransition("PROPOSED", "ACTIVE")).toThrow(ApiError);
  });
});
