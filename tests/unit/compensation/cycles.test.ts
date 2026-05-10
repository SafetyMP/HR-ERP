import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/v1/errors";
import { assertValidCompensationCycleTransition } from "@/lib/compensation/cycles";

describe("assertValidCompensationCycleTransition", () => {
  it("walks DRAFT → OPEN → REVIEW → APPROVED → APPLIED → CLOSED", () => {
    expect(() => assertValidCompensationCycleTransition("DRAFT", "OPEN")).not.toThrow();
    expect(() => assertValidCompensationCycleTransition("OPEN", "REVIEW")).not.toThrow();
    expect(() => assertValidCompensationCycleTransition("REVIEW", "APPROVED")).not.toThrow();
    expect(() => assertValidCompensationCycleTransition("APPROVED", "APPLIED")).not.toThrow();
    expect(() => assertValidCompensationCycleTransition("APPLIED", "CLOSED")).not.toThrow();
  });

  it("permits early termination via CLOSED from any active state", () => {
    expect(() => assertValidCompensationCycleTransition("OPEN", "CLOSED")).not.toThrow();
    expect(() => assertValidCompensationCycleTransition("REVIEW", "CLOSED")).not.toThrow();
    expect(() => assertValidCompensationCycleTransition("APPROVED", "CLOSED")).not.toThrow();
  });

  it("blocks rewinding the funnel", () => {
    expect(() => assertValidCompensationCycleTransition("APPROVED", "OPEN")).toThrow(ApiError);
    expect(() => assertValidCompensationCycleTransition("APPLIED", "REVIEW")).toThrow(ApiError);
    expect(() => assertValidCompensationCycleTransition("CLOSED", "OPEN")).toThrow(ApiError);
  });

  it("blocks skipping the APPROVED gate before APPLIED", () => {
    expect(() => assertValidCompensationCycleTransition("OPEN", "APPLIED")).toThrow(ApiError);
    expect(() => assertValidCompensationCycleTransition("REVIEW", "APPLIED")).toThrow(ApiError);
  });
});
