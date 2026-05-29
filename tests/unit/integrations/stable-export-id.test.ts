import { describe, expect, it } from "vitest";

import { stableExportId } from "@/lib/integrations/instances-service";

describe("stableExportId", () => {
  it("returns the same export id for identical inputs", () => {
    const parts = {
      tenantId: "tenant-a",
      payrollPeriodId: "period-1",
      integrationId: "int-1",
      payloadHash: "abc123",
    };
    expect(stableExportId(parts)).toBe(stableExportId(parts));
  });

  it("returns different ids when payload hash changes", () => {
    const base = {
      tenantId: "tenant-a",
      payrollPeriodId: "period-1",
      integrationId: "int-1",
      payloadHash: "abc123",
    };
    expect(stableExportId(base)).not.toBe(
      stableExportId({ ...base, payloadHash: "def456" }),
    );
  });
});
