#!/usr/bin/env node
/**
 * CI smoke: Cedar policy tool names match COPILOT_TOOL_CATALOG; protect-mcp config is shadow.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const catalogPath = join(root, "lib/copilot/mcp-tools.ts");
const cedarPath = join(root, "lib/copilot/governance/policy.cedar");
const configPath = join(root, "lib/copilot/governance/protect-mcp.config.json");

let failed = false;

function err(msg) {
  console.error(`ERROR: ${msg}`);
  failed = true;
}

if (!existsSync(catalogPath)) {
  err("missing lib/copilot/mcp-tools.ts");
  process.exit(1);
}

const catalogSrc = readFileSync(catalogPath, "utf8");
const toolNames = [...catalogSrc.matchAll(/name:\s*"([^"]+)"/g)].map((m) => m[1]);

if (!existsSync(cedarPath)) {
  err("missing policy.cedar");
} else {
  const cedar = readFileSync(cedarPath, "utf8");
  for (const name of toolNames) {
    if (!cedar.includes(`"${name}"`)) {
      err(`Cedar policy missing catalog tool: ${name}`);
    }
  }
}

if (!existsSync(configPath)) {
  err("missing protect-mcp.config.json");
} else {
  const cfg = JSON.parse(readFileSync(configPath, "utf8"));
  if (cfg.mode !== "shadow") {
    err(`protect-mcp mode must be shadow in CI (got ${cfg.mode})`);
  }
  if (!existsSync(join(root, cfg.policyPath ?? "lib/copilot/governance/policy.cedar"))) {
    err("protect-mcp policyPath not found");
  }
}

if (failed) process.exit(1);
console.log(`protect-mcp shadow check OK (${toolNames.length} catalog tools)`);
process.exit(0);
