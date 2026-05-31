#!/usr/bin/env node
/**
 * governance-sync-agent-rules — verify thin agent-*.mdc stubs match manifest agentRules
 *
 * Usage:
 *   node scripts/governance-sync-agent-rules.mjs --check
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadManifest } from "./governance-manifest.mjs";

function parseArgs(argv) {
  return { check: argv.includes("--check") };
}

function skillsFromMdc(body) {
  const found = new Set();
  for (const m of body.matchAll(/@([a-z0-9-]+)/gi)) {
    found.add(m[1].toLowerCase());
  }
  return found;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.check) {
    console.error("Usage: node scripts/governance-sync-agent-rules.mjs --check");
    return 1;
  }

  const manifest = loadManifest();
  const agentRules = manifest.agentRules ?? {};
  let exit = 0;

  for (const [ruleId, cfg] of Object.entries(agentRules)) {
    const path = join(process.cwd(), ".cursor", "rules", `${ruleId}.mdc`);
    if (!existsSync(path)) {
      console.error(`ERROR: missing agent rule file for manifest entry: ${ruleId}`);
      exit = 1;
      continue;
    }
    const body = readFileSync(path, "utf8");
    const expectedSkill = cfg.skill;
    const skills = skillsFromMdc(body);
    if (!skills.has(expectedSkill.toLowerCase())) {
      console.error(
        `ERROR: ${ruleId}.mdc missing manifest primary skill @${expectedSkill} (found: ${[...skills].join(", ") || "none"})`,
      );
      exit = 1;
    } else {
      console.log(`OK: ${ruleId} → @${expectedSkill}`);
    }
  }

  const manifestIds = new Set(Object.keys(agentRules));
  const ruleDir = join(process.cwd(), ".cursor", "rules");
  for (const name of readdirSync(ruleDir)) {
    if (!name.startsWith("agent-") || !name.endsWith(".mdc")) continue;
    const id = name.replace(/\.mdc$/, "");
    if (!manifestIds.has(id)) {
      console.warn(`WARN: ${name} exists on disk but not in manifest agentRules`);
    }
  }

  return exit;
}

process.exit(main());
