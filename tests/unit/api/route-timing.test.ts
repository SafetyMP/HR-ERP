import { describe, expect, it, vi } from "vitest";

import { logEssRouteTiming } from "@/lib/api/v1/route-timing";

describe("logEssRouteTiming", () => {
  it("warns when ESS read exceeds p95 budget", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    logEssRouteTiming("/api/v1/me/benefits/summary", 450, "corr-1");
    expect(warn).toHaveBeenCalledOnce();
    const payload = JSON.parse(String(warn.mock.calls[0]?.[0]));
    expect(payload.scope).toBe("ess_api_timing");
    expect(payload.slow).toBe(true);
    warn.mockRestore();
  });

  it("ignores non-ESS paths", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    logEssRouteTiming("/api/v1/payroll/runs", 900, "corr-2");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
