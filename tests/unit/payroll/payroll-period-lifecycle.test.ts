import { describe, expect, it } from "vitest";

import { hashFilingPayload } from "@/lib/payroll/filing-artifact-hash";
import { buildUsFilingArtifact } from "@/lib/payroll/filing-artifact-us";
import {
  assertPeriodAllowsPayRun,
  statusAfterPayRun,
} from "@/lib/payroll/payroll-period-lifecycle";

describe("payroll period lifecycle", () => {
  it("blocks pay run when locked", () => {
    expect(() => assertPeriodAllowsPayRun("LOCKED")).toThrow();
    expect(() => assertPeriodAllowsPayRun("ARTIFACT_GENERATED")).toThrow();
    expect(() => assertPeriodAllowsPayRun("OPEN")).not.toThrow();
  });

  it("moves to COMPUTED after employees computed", () => {
    expect(statusAfterPayRun(2, "OPEN")).toBe("COMPUTED");
    expect(statusAfterPayRun(0, "OPEN")).toBe("OPEN");
    expect(statusAfterPayRun(1, "LOCKED")).toBe("LOCKED");
  });
});

describe("US filing artifact", () => {
  it("produces stable payload hash", () => {
    const input = {
      payrollPeriodId: "p1",
      startDate: "2026-01-01",
      endDate: "2026-01-15",
      policyReleaseId: "test-policy",
      instructions: [
        {
          employeeId: "e1",
          paymentInstructionId: "pi1",
          inputsFingerprintSha256: "abc",
          netPayMinor: 1000,
          currencyCode: "USD",
        },
      ],
      openExceptionCount: 0,
    };
    const a = buildUsFilingArtifact(input);
    const b = buildUsFilingArtifact(input);
    expect(a.payloadHash).toBe(b.payloadHash);
    expect(hashFilingPayload(a.payload)).toBe(a.payloadHash);
  });
});
