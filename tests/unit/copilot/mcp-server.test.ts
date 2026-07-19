import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const script = join(process.cwd(), "scripts/copilot-mcp-server.ts");

function rpc(input: object, env: Record<string, string> = {}) {
  return spawnSync("npx", ["tsx", script], {
    input: JSON.stringify(input) + "\n",
    encoding: "utf8",
    cwd: process.cwd(),
    env: { ...process.env, ...env },
  });
}

function firstJsonLine(stdout: string) {
  const line = stdout.trim().split("\n").find(Boolean);
  expect(line).toBeDefined();
  return JSON.parse(line!);
}

describe("copilot MCP server scaffold", () => {
  // spawnSync + npx/tsx cold-start can exceed the default 5s under full verify load
  const stdioTimeoutMs = 30_000;

  it(
    "responds to tools/list over stdio with Zod-derived schemas",
    () => {
      const r = rpc({ jsonrpc: "2.0", id: 1, method: "tools/list" });
      expect(r.status).toBe(0);
      const msg = firstJsonLine(r.stdout);
      expect(msg.result.tools.length).toBeGreaterThanOrEqual(3);
      const summary = msg.result.tools.find((t: { name: string }) => t.name === "get_employee_summary");
      expect(summary.inputSchema.properties?.employeeId).toBeDefined();
    },
    stdioTimeoutMs,
  );

  it(
    "denies tools/call without COPILOT_MCP_ALLOW_STDIO",
    () => {
      const r = rpc({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "get_my_pto_balance", arguments: {} },
      });
      expect(r.status).toBe(0);
      const msg = firstJsonLine(r.stdout);
      expect(msg.error?.message).toMatch(/COPILOT_MCP_ALLOW_STDIO/);
    },
    stdioTimeoutMs,
  );

  it(
    "rejects invalid arguments when stdio gate is open",
    () => {
      const r = rpc(
        {
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: { name: "get_employee_summary", arguments: { employeeId: "not-a-uuid" } },
        },
        { COPILOT_MCP_ALLOW_STDIO: "1" },
      );
      const msg = firstJsonLine(r.stdout);
      expect(msg.error?.code).toBe(-32602);
    },
    stdioTimeoutMs,
  );

  it(
    "accepts valid arguments when stdio gate is open",
    () => {
      const r = rpc(
        {
          jsonrpc: "2.0",
          id: 4,
          method: "tools/call",
          params: {
            name: "get_employee_summary",
            arguments: { employeeId: "b0000001-0001-4000-8000-000000000011" },
          },
        },
        { COPILOT_MCP_ALLOW_STDIO: "1" },
      );
      const msg = firstJsonLine(r.stdout);
      expect(msg.result?.content?.[0]?.text).toContain("not_implemented");
    },
    stdioTimeoutMs,
  );
});

describe("protect-mcp shadow check", () => {
  it("passes when catalog aligns with Cedar", () => {
    const r = spawnSync("node", ["scripts/protect-mcp-shadow-check.mjs"], {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("shadow check OK");
  });
});
