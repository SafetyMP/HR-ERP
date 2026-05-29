import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

describe("copilot MCP server scaffold", () => {
  it("responds to tools/list over stdio", () => {
    const script = join(process.cwd(), "scripts/copilot-mcp-server.ts");
    const r = spawnSync("npx", ["tsx", script], {
      input: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) + "\n",
      encoding: "utf8",
      cwd: process.cwd(),
    });
    expect(r.status).toBe(0);
    const line = r.stdout.trim().split("\n").find(Boolean);
    expect(line).toBeDefined();
    const msg = JSON.parse(line!);
    expect(msg.result.tools.length).toBeGreaterThanOrEqual(3);
  });
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
