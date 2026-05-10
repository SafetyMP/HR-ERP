import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/v1/errors";
import { assertValidStageTransition } from "@/lib/recruiting/applications";

describe("assertValidStageTransition", () => {
  it("allows the canonical happy path", () => {
    expect(() => assertValidStageTransition("APPLIED", "SCREENING")).not.toThrow();
    expect(() => assertValidStageTransition("SCREENING", "INTERVIEW")).not.toThrow();
    expect(() => assertValidStageTransition("INTERVIEW", "OFFER")).not.toThrow();
    expect(() => assertValidStageTransition("OFFER", "HIRED")).not.toThrow();
  });

  it("permits rejection or withdrawal from any active stage", () => {
    for (const from of ["APPLIED", "SCREENING", "INTERVIEW", "OFFER"] as const) {
      expect(() => assertValidStageTransition(from, "REJECTED")).not.toThrow();
      expect(() => assertValidStageTransition(from, "WITHDRAWN")).not.toThrow();
    }
  });

  it("rejects skipping intermediate stages", () => {
    expect(() => assertValidStageTransition("APPLIED", "OFFER")).toThrow(ApiError);
    expect(() => assertValidStageTransition("APPLIED", "HIRED")).toThrow(ApiError);
    expect(() => assertValidStageTransition("SCREENING", "OFFER")).toThrow(ApiError);
  });

  it("rejects backwards transitions", () => {
    expect(() => assertValidStageTransition("INTERVIEW", "APPLIED")).toThrow(ApiError);
    expect(() => assertValidStageTransition("OFFER", "SCREENING")).toThrow(ApiError);
  });

  it("treats terminal stages as final", () => {
    for (const from of ["HIRED", "REJECTED", "WITHDRAWN"] as const) {
      for (const to of [
        "APPLIED",
        "SCREENING",
        "INTERVIEW",
        "OFFER",
        "HIRED",
      ] as const) {
        expect(() => assertValidStageTransition(from, to)).toThrow(ApiError);
      }
    }
  });
});
