#!/usr/bin/env node
/**
 * CI smoke: Cedar policy tool names match COPILOT_TOOL_CATALOG; protect-mcp
 * stays in documented shadow mode; protect-mcp is pinned to ^0.7.x (FO-013 /
 * GHSA-hm46-7j72-rpv9: 0.5/0.6 fail-open).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const catalogPath = join(root, "lib/copilot/mcp-tools.ts");
const cedarPath = join(root, "lib/copilot/governance/policy.cedar");
const configPath = join(root, "lib/copilot/governance/protect-mcp.config.json");
const packagePath = join(root, "package.json");
const NPX_PIN = /npx\s+protect-mcp@\^?0\.7(\.\d+)?\b/;
const NPX_UNPINNED = /npx\s+protect-mcp(?!@)/;
const PINNED_FILES = [
  "lib/copilot/governance/README.md",
  "scripts/copilot-mcp-server.ts",
  ".cursor/skills/hr-product-mcp-governance/references/transport-rollout.md",
];

function protectMcpPinOk(spec) {
  if (typeof spec !== "string") return false;
  if (/(^|[^\d])0\.[56](\.|$)/.test(spec)) return false;
  return /^\^0\.7(\.\d+)?$/.test(spec) || /^~0\.7(\.\d+)?$/.test(spec) || /^0\.7\.\d+$/.test(spec);
}

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

if (!existsSync(packagePath)) {
  err("missing package.json");
} else {
  const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  const spec = pkg.devDependencies?.["protect-mcp"] ?? pkg.dependencies?.["protect-mcp"];
  if (!protectMcpPinOk(spec)) {
    err(`protect-mcp must be pinned to ^0.7.0 or 0.7.x (got ${spec ?? "missing"})`);
  }
}

for (const rel of PINNED_FILES) {
  const p = join(root, rel);
  if (!existsSync(p)) {
    err(`missing ${rel} for protect-mcp pin check`);
    continue;
  }
  const src = readFileSync(p, "utf8");
  if (NPX_UNPINNED.test(src) || (src.includes("protect-mcp") && !NPX_PIN.test(src))) {
    err(`unpinned npx protect-mcp in ${rel}; use npx protect-mcp@^0.7.0`);
  }
}

if (failed) process.exit(1);
console.log(`protect-mcp shadow check OK (${toolNames.length} catalog tools)`);
process.exit(0);
