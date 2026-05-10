import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/v1/errors";
import { assertValidCycleTransition } from "@/lib/performance/cycles";

describe("assertValidCycleTransition", () => {
  it("walks the canonical lifecycle", () => {
    expect(() => assertValidCycleTransition("DRAFT", "OPEN")).not.toThrow();
    expect(() => assertValidCycleTransition("OPEN", "CALIBRATION")).not.toThrow();
    expect(() => assertValidCycleTransition("CALIBRATION", "CLOSED")).not.toThrow();
  });

  it("supports skipping calibration straight to CLOSED", () => {
    expect(() => assertValidCycleTransition("OPEN", "CLOSED")).not.toThrow();
  });

  it("rejects backwards or skipping to non-adjacent states", () => {
    expect(() => assertValidCycleTransition("OPEN", "DRAFT")).toThrow(ApiError);
    expect(() => assertValidCycleTransition("CLOSED", "OPEN")).toThrow(ApiError);
    expect(() => assertValidCycleTransition("DRAFT", "CALIBRATION")).toThrow(ApiError);
  });
});
