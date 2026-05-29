#!/usr/bin/env node
import { mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { readHookInput, enforceOrLog, allow, logHook, loadMcpAllowlist } from "./lib.mjs";

const input = readHookInput();
const toolName = input.tool_name ?? "";
const serverName = input.server_name ?? input.mcp_server ?? "";

const allowlist = loadMcpAllowlist();
if (allowlist.size > 0 && serverName && !allowlist.has(serverName)) {
  enforceOrLog(
    "mcp_not_allowlisted",
    `MCP server "${serverName}" is not in .cursor/mcp.json allowlist.`,
    `Add the server to .cursor/mcp.json or use an allowlisted plugin.`,
  );
}

const receiptsDir = join(process.cwd(), ".protect-mcp", "receipts");
mkdirSync(receiptsDir, { recursive: true });
if (toolName) {
  appendFileSync(
    join(receiptsDir, "ide-shadow.log"),
    JSON.stringify({ ts: new Date().toISOString(), tool_name: toolName, server: serverName, mode: "shadow" }) + "\n",
  );
}

logHook("beforeMCPExecution", { tool_name: toolName, server: serverName });
console.log(allow());
process.exit(0);
