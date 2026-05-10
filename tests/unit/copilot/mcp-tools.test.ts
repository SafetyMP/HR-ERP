import { describe, expect, it } from "vitest";

import {
  COPILOT_TOOL_CATALOG,
  getCopilotTool,
  GetEmployeeSummaryInput,
} from "@/lib/copilot/mcp-tools";

describe("COPILOT_TOOL_CATALOG", () => {
  it("uses unique tool names", () => {
    const names = COPILOT_TOOL_CATALOG.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("only exposes read-style permissions", () => {
    for (const tool of COPILOT_TOOL_CATALOG) {
      expect(tool.permission.endsWith("_read") || tool.permission.includes(":read"))
        .toBe(true);
    }
  });

  it("validates argument shape via inputSchema before invocation", () => {
    expect(() => GetEmployeeSummaryInput.parse({ employeeId: "not-a-uuid" })).toThrow();
    expect(() =>
      GetEmployeeSummaryInput.parse({
        employeeId: "12345678-1234-4234-9234-123456789012",
      }),
    ).not.toThrow();
  });

  it("returns undefined for unregistered tools (defense against prompt injection)", () => {
    expect(getCopilotTool("rm_-rf_/")).toBeUndefined();
  });
});
