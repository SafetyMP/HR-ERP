#!/usr/bin/env node
import { mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import {
  readHookInput,
  enforceOrLog,
  allow,
  logHook,
  loadMcpAllowlist,
  resolveHookMode,
} from "./lib.mjs";

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

const blockPrisma =
  process.env.GOVERNANCE_BLOCK_PRISMA_MCP === "1" ||
  (process.env.DATABASE_URL &&
    !/localhost|127\.0\.0\.1|postgresql:\/\/ci:/i.test(process.env.DATABASE_URL));
if (serverName === "prisma" && blockPrisma) {
  enforceOrLog(
    "prisma_mcp_blocked",
    "Prisma MCP is blocked when DATABASE_URL is not a local/CI database.",
    "Unset GOVERNANCE_BLOCK_PRISMA_MCP=1 only for local dev with a sandbox DB.",
  );
}

const hookMode = resolveHookMode();
const receiptsDir = join(process.cwd(), ".protect-mcp", "receipts");
mkdirSync(receiptsDir, { recursive: true });
if (toolName) {
  appendFileSync(
    join(receiptsDir, "ide-shadow.log"),
    JSON.stringify({
      ts: new Date().toISOString(),
      tool_name: toolName,
      server: serverName,
      mode: hookMode,
    }) + "\n",
  );
}

logHook("beforeMCPExecution", { tool_name: toolName, server: serverName });
console.log(allow());
process.exit(0);
