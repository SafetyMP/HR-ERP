#!/usr/bin/env node
/**
 * governance-lint — risk-tier classifier, function-lane DAG, PR body validator
 * Canonical: ~/.cursor/scripts/governance-lint.mjs
 *
 * Usage:
 *   node governance-lint.mjs diff [--base main] [--strict]
 *   node governance-lint.mjs pr-body [--file path] [--body text] [--strict]
 *   node governance-lint.mjs handoff --file handoff.json [--strict] [--discover]
 *   node governance-lint.mjs plan [--base main] [--strict] [--json] [--quiet]
 *   node governance-lint.mjs pr-body-generate [--base main]
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const TIER_ORDER = ["T0", "T1", "T2", "T3", "T4"];

function resolveManifestPath() {
  if (process.env.GOVERNANCE_MANIFEST && existsSync(process.env.GOVERNANCE_MANIFEST)) {
    return process.env.GOVERNANCE_MANIFEST;
  }
  const candidates = [
    join(process.cwd(), ".cursor", "governance", "governance-manifest.yaml"),
    join(homedir(), ".cursor", "governance", "governance-manifest.yaml"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    "Manifest not found. Set GOVERNANCE_MANIFEST or install at ~/.cursor/governance/governance-manifest.yaml",
  );
}

function parseArgs(argv) {
  const args = {
    strict: false,
    base: "main",
    file: null,
    body: null,
    json: false,
    quiet: false,
    failOnUnderTier: false,
    discover: false,
  };
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--strict") args.strict = true;
    else if (a === "--json") args.json = true;
    else if (a === "--quiet") args.quiet = true;
    else if (a === "--fail-on-under-tier") args.failOnUnderTier = true;
    else if (a === "--discover") args.discover = true;
    else if (a === "--base") args.base = argv[++i];
    else if (a === "--file") args.file = argv[++i];
    else if (a === "--body") args.body = argv[++i];
    else positional.push(a);
  }
  args.command = positional[0] ?? "diff";
  return args;
}

function parsePathTriggerBlock(block) {
  if (!block.includes("minTier:")) return null;
  const id = block.split("\n")[0].trim();
  const minTierM = block.match(/minTier:\s+(T\d)/);
  const paths = [...block.matchAll(/^\s+- "([^"]+)"/gm)].map((m) => m[1]);
  const attachSkills = [...block.matchAll(/^\s+- (hr-[a-z0-9-]+)/gm)]
    .map((m) => m[1])
    .filter((s) => s.startsWith("hr-"));
  if (!minTierM || paths.length === 0) return null;
  const laneBlock = block.match(/requiredLanes:\n((?:\s+- [a-z_]+\n)+)/);
  const lanes = laneBlock
    ? [...laneBlock[1].matchAll(/^\s+- ([a-z_]+)/gm)].map((m) => m[1])
    : [];
  return {
    id,
    minTier: minTierM[1],
    paths,
    attachSkills: [...new Set(attachSkills)],
    requiredLanes: lanes,
  };
}

function parsePathTriggerBlocks(raw, sectionName) {
  const triggers = [];
  const re = new RegExp(`^${sectionName}:\\n`, "m");
  const start = raw.search(re);
  if (start === -1) return triggers;

  const afterSection = raw.slice(start);
  const lines = afterSection.split("\n");
  const sectionLines = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^[a-zA-Z][a-zA-Z0-9_]*:/.test(line) && !line.startsWith("  ")) break;
    sectionLines.push(line);
  }
  const blocks = sectionLines.join("\n").split(/^  - id:/m).slice(1);
  for (const block of blocks) {
    const trigger = parsePathTriggerBlock(block);
    if (trigger) triggers.push(trigger);
  }
  return triggers;
}

function parseManifestYaml(raw) {
  const versionM = raw.match(/^version:\s*(\d+)/m);
  const version = versionM ? Number(versionM[1]) : 1;
  const runtimeProfile = raw.match(/^runtimeProfile:\s*(\S+)/m)?.[1] ?? null;
  const hookEnforcement = /^hookEnforcement:\s*true/m.test(raw);
  const maxSkillBodiesGlobal = raw.match(/^maxSkillBodies:\s*(\d+)/m)?.[1];
  const nativeCommands = {};
  const ncBlock = raw.match(/^nativeCommands:\n((?:  [^\n]+\n)+)/m);
  if (ncBlock) {
    for (const m of ncBlock[1].matchAll(/^  (\w+):\s*(.+)$/gm)) {
      nativeCommands[m[1]] = m[2].trim();
    }
  }

  const triggers = parsePathTriggerBlocks(raw, "pathTriggers");

  const skillIdBlock = raw.match(/^skillIds:\n((?:  - [^\n]+\n)+)/m);
  const skillIds = skillIdBlock
    ? [...skillIdBlock[1].matchAll(/^\s+- ([a-z0-9-]+)/gm)].map((m) => m[1])
    : [];

  const functionIdBlock = raw.match(/^functionIds:\n((?:  - [^\n]+\n)+)/m);
  const functionIds = functionIdBlock
    ? [...functionIdBlock[1].matchAll(/^\s+- ([a-z_]+)/gm)].map((m) => m[1])
    : [];

  const agentFunctions = {};
  const fnBlocks = raw.split(/^  ([a-z_]+):$/m).slice(1);
  for (let i = 0; i < fnBlocks.length; i += 2) {
    const name = fnBlocks[i];
    const body = fnBlocks[i + 1] ?? "";
    if (!body.includes("minRiskTier:")) continue;
    const minRiskTier = body.match(/minRiskTier:\s+(T\d)/)?.[1];
    const agentRule = body.match(/agentRule:\s+(\S+)/)?.[1];
    if (minRiskTier) {
      agentFunctions[name] = {
        minRiskTier,
        agentRule: agentRule === "null" ? null : agentRule,
      };
    }
  }

  const riskTiers = {};
  for (const t of TIER_ORDER) {
    const m = raw.match(new RegExp(`^  ${t}:\\n([\\s\\S]*?)(?=^  T\\d:|^choreClasses:|^skills:|^agentFunctions:)`, "m"));
    if (m) {
      const maxTasks = m[1].match(/maxDelegatedTasks:\s+(\d+)/);
      if (maxTasks) riskTiers[t] = { maxDelegatedTasks: Number(maxTasks[1]) };
    }
  }

  return {
    version,
    runtimeProfile,
    hookEnforcement,
    maxSkillBodiesGlobal: maxSkillBodiesGlobal ? Number(maxSkillBodiesGlobal) : 2,
    nativeCommands,
    pathTriggers: triggers,
    skillIds,
    functionIds,
    agentFunctions,
    riskTiers,
  };
}

function mergePathTriggers(base, overlay) {
  const byId = new Map(base.map((t) => [t.id, { ...t }]));
  for (const t of overlay) {
    const existing = byId.get(t.id);
    if (!existing) {
      byId.set(t.id, { ...t });
      continue;
    }
    byId.set(t.id, {
      ...existing,
      ...t,
      paths: [...new Set([...existing.paths, ...t.paths])],
      attachSkills: [...new Set([...(existing.attachSkills ?? []), ...(t.attachSkills ?? [])])],
      requiredLanes: [...new Set([...(existing.requiredLanes ?? []), ...(t.requiredLanes ?? [])])],
      minTier: maxTier(existing.minTier, t.minTier),
    });
  }
  return [...byId.values()];
}

function loadManifest() {
  const path = resolveManifestPath();
  const raw = readFileSync(path, "utf8");
  const parsed = parseManifestYaml(raw);
  parsed.path = path;

  const overlayPath = join(process.cwd(), ".cursor", "governance-overlay.yaml");
  if (existsSync(overlayPath)) {
    const overlayRaw = readFileSync(overlayPath, "utf8");
    const overlayTriggers = parsePathTriggerBlocks(overlayRaw, "additionalPathTriggers");
    if (overlayTriggers.length) {
      parsed.pathTriggers = mergePathTriggers(parsed.pathTriggers, overlayTriggers);
    }
  }

  return parsed;
}

function globToRegExp(glob) {
  let re = "^";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        re += ".*";
        i++;
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += ".";
    } else if ("\\.[]{}()+^$|".includes(c)) {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  re += "$";
  return new RegExp(re);
}

function matchPath(file, pattern) {
  const normalized = file.replace(/\\/g, "/");
  const pat = pattern.replace(/\\/g, "/");
  if (pat.includes("*")) {
    return globToRegExp(pat).test(normalized) || normalized.startsWith(pat.replace(/\*\*$/, ""));
  }
  return normalized === pat || normalized.startsWith(pat + "/");
}

function maxTier(a, b) {
  return TIER_ORDER.indexOf(a) >= TIER_ORDER.indexOf(b) ? a : b;
}

function tierAtLeast(actual, required) {
  return TIER_ORDER.indexOf(actual) >= TIER_ORDER.indexOf(required);
}

function classifyFiles(files, manifest) {
  let suggestedTier = "T0";
  const matchedTriggers = [];
  const suggestedSkills = new Set();
  const requiredLanes = new Set();

  const hasAppOrContract = files.some(
    (f) =>
      f.match(/^(src\/|lib\/|contracts\/|packages\/|middleware\.ts)/) &&
      !f.match(/^docs\//) &&
      !f.endsWith(".md"),
  );

  if (hasAppOrContract) suggestedTier = "T1";

  for (const trigger of manifest.pathTriggers) {
    for (const file of files) {
      for (const pattern of trigger.paths) {
        if (matchPath(file, pattern)) {
          suggestedTier = maxTier(suggestedTier, trigger.minTier);
          matchedTriggers.push({ id: trigger.id, file, minTier: trigger.minTier });
          for (const s of trigger.attachSkills ?? []) suggestedSkills.add(s);
          for (const lane of trigger.requiredLanes ?? []) requiredLanes.add(lane);
        }
      }
    }
  }

  const suggestedLanes = buildSuggestedLanes(suggestedTier, requiredLanes, matchedTriggers);

  return {
    suggestedTier,
    matchedTriggers,
    suggestedSkills: [...suggestedSkills],
    requiredLanes: [...requiredLanes],
    suggestedLanes,
  };
}

function buildSuggestedLanes(tier, requiredLanes, matchedTriggers) {
  const lanes = new Set(["scout", "architect", "builder", "sentinel", "verifier"]);
  for (const l of requiredLanes) lanes.add(l);

  const ids = new Set(matchedTriggers.map((t) => t.id));
  if (ids.has("ddl_migrations")) {
    lanes.add("custodian");
    lanes.delete("builder");
    lanes.add("builder");
  }
  if (ids.has("packaging_supply_chain")) lanes.add("packaging");
  if (ids.has("devops_lifecycle")) lanes.add("release_ops");
  if (ids.has("compliance_pay_time") || ids.has("ai_governance") || ids.has("mlops_inference")) {
    lanes.add("counsel");
    if (ids.has("ai_governance")) lanes.add("ai_governance_reviewer");
    if (ids.has("mlops_inference")) lanes.add("mlops_reviewer");
  }
  if (ids.has("product_runtime_mcp")) {
    lanes.add("counsel");
    lanes.add("ai_governance_reviewer");
    lanes.add("sentinel");
  }
  if (tier === "T4") lanes.add("finops_coordinator");

  return [...lanes];
}

function getDiffFiles(base) {
  const files = new Set();
  const add = (out) => {
    out
      .trim()
      .split("\n")
      .filter(Boolean)
      .forEach((f) => files.add(f));
  };
  try {
    add(execSync(`git diff --name-only ${base}...HEAD`, { encoding: "utf8" }));
  } catch {
    /* no merge base */
  }
  try {
    add(execSync("git diff --name-only HEAD", { encoding: "utf8" }));
  } catch {
    /* not a git repo */
  }
  return [...files];
}

const PLACEHOLDER_RE = /(?:^|\s)(___|TBD|\bN\/A\s*or\s*brief\s*path\b)(?:\s|$)/im;

function goldenThreadHasFilledRow(body) {
  const rows = body.split("\n").filter((line) => line.trim().startsWith("|") && !line.includes("---"));
  for (const row of rows) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    if (cells[0].toLowerCase().includes("risk or requirement")) continue;
    const hasContent = cells.some((c) => c.length > 0 && !PLACEHOLDER_RE.test(c) && c !== "N/A");
    if (hasContent) return true;
  }
  return false;
}

function poCheckpointHasContent(body) {
  if (/step 1 chore N\/A/i.test(body)) return true;
  if (/PO gate complete:\s*Y/i.test(body)) return true;
  if (/UAC count:\s*\d+/i.test(body)) return true;
  const brief = body.match(/Feature brief[^:]*:\s*(\S+)/i);
  if (brief?.[1] && !PLACEHOLDER_RE.test(brief[1])) return true;
  return false;
}

function prBodyReferencesLane(body, lane) {
  const re = new RegExp(`\\*\\*${lane}\\*\\*|\\b${lane}\\b`, "i");
  return re.test(body);
}

function validatePrBody(body, suggestedTier, strict, options = {}) {
  const { failOnUnderTier = false, requiredLanes = [] } = options;
  const issues = [];
  const warnings = [];

  const tierM =
    body.match(/\*\*riskTier:\*\*\s*(T[0-4])/i) ?? body.match(/riskTier:\s*(T[0-4])/i);
  if (!tierM && suggestedTier !== "T0") {
    issues.push("PR body missing riskTier declaration (T0–T4)");
  } else if (tierM) {
    const declared = tierM[1].toUpperCase();
    if (TIER_ORDER.indexOf(declared) < TIER_ORDER.indexOf(suggestedTier)) {
      const msg = `Declared ${declared} is below suggested ${suggestedTier} from diff paths`;
      if (strict || failOnUnderTier) issues.push(msg);
      else warnings.push(msg);
    }
  }

  if (
    suggestedTier !== "T0" &&
    !body.includes("Golden thread") &&
    !body.match(/\| Risk or requirement \|/)
  ) {
    issues.push("PR body missing golden thread stub table (required when tier ≥ T1)");
  }

  if (suggestedTier !== "T0" && !body.match(/PO orchestration checkpoint|step 1 chore N\/A/i)) {
    issues.push("PR body missing PO orchestration checkpoint block or chore N/A");
  }

  if (strict && suggestedTier !== "T0") {
    if (!poCheckpointHasContent(body)) {
      issues.push(
        "PR body PO checkpoint appears empty or placeholder-only (fill brief path, UAC, gate Y/N)",
      );
    }
    if (!goldenThreadHasFilledRow(body)) {
      issues.push("PR body golden thread must include at least one filled data row");
    }
    for (const lane of requiredLanes) {
      if (
        ["ai_governance_reviewer", "sentinel", "counsel", "custodian", "release_ops"].includes(lane)
      ) {
        if (!prBodyReferencesLane(body, lane)) {
          issues.push(`PR body must reference required lane "${lane}" in golden thread or sign-off`);
        }
      }
    }
  }

  if (tierAtLeast(suggestedTier, "T1") && !body.match(/Lifecycle \(S&OP|value delivery|value-delivery-record/i)) {
    warnings.push(
      "PR body missing Lifecycle (S&OP / value) section or value delivery record link (advisory for T1+)",
    );
  }

  for (const msg of warnings) console.warn(`WARN: ${msg}`);
  for (const msg of issues) console.error(`ERROR: ${msg}`);

  return strict && issues.length > 0 ? 1 : issues.length > 0 && !strict ? 0 : 0;
}

function handoffsSatisfyRequiredLanes(requiredLanes) {
  if (!requiredLanes.length) return true;
  const paths = discoverHandoffFiles();
  if (!paths.length) return false;
  for (const fp of paths) {
    try {
      const data = JSON.parse(readFileSync(fp, "utf8"));
      const plan = data.delegatedTaskPlan ?? [];
      const functionsInPlan = new Set(plan.map((p) => p.function).filter(Boolean));
      if (requiredLanes.every((lane) => functionsInPlan.has(lane))) return true;
    } catch {
      /* skip invalid json */
    }
  }
  return false;
}

function validateDiffStrict(result) {
  const issues = [];
  const triggerIds = new Set(result.matchedTriggers.map((t) => t.id));

  if (tierAtLeast(result.suggestedTier, "T2") && result.requiredLanes.length > 0) {
    if (!handoffsSatisfyRequiredLanes(result.requiredLanes)) {
      issues.push(
        `Diff suggests ${result.suggestedTier} with required lanes: ${result.requiredLanes.join(", ")} — add specs/**/orchestrator*.json handoff with delegatedTaskPlan`,
      );
    }
  }

  if (triggerIds.has("product_runtime_mcp")) {
    if (!result.requiredLanes.includes("ai_governance_reviewer")) {
      issues.push("product_runtime_mcp trigger must require ai_governance_reviewer lane");
    }
  }

  for (const msg of issues) console.error(`ERROR: ${msg}`);
  return issues.length > 0 ? 1 : 0;
}

function walkJsonFiles(dir, out, root = dir) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkJsonFiles(p, out, root);
    else if (name.endsWith(".json") && name.includes("orchestrator")) out.push(p);
  }
  return out;
}

function discoverHandoffFiles() {
  const specsDir = join(process.cwd(), "specs");
  const found = walkJsonFiles(specsDir, []);
  return found.filter(
    (p) =>
      !p.includes(`${join("specs", "templates")}`) &&
      !p.endsWith(".schema.json"),
  );
}

function planFromHandoff(data, manifest) {
  const issues = [];
  const plan = data.delegatedTaskPlan ?? [];
  if (!plan.length) return { issues, ok: false };

  const functionsInPlan = new Set(plan.map((p) => p.function).filter(Boolean));
  const files = data.suspectedPaths ?? [];
  const { requiredLanes, matchedTriggers } = classifyFiles(files, manifest);

  for (const lane of requiredLanes) {
    if (!functionsInPlan.has(lane)) {
      const triggerIds = matchedTriggers
        .filter((t) => (manifest.pathTriggers.find((x) => x.id === t.id)?.requiredLanes ?? []).includes(lane))
        .map((t) => t.id);
      issues.push(
        `delegatedTaskPlan missing required lane "${lane}"${triggerIds.length ? ` (triggers: ${[...new Set(triggerIds)].join(", ")})` : ""}`,
      );
    }
  }

  return { issues, ok: issues.length === 0 };
}

function validateHandoffDag(plan) {
  const issues = [];
  if (!plan?.length) return issues;

  const byKey = new Map();
  for (let i = 0; i < plan.length; i++) {
    const item = plan[i];
    const key = item.function ?? item.intent ?? `task-${i}`;
    byKey.set(key, item);
  }

  const visiting = new Set();
  const visited = new Set();

  function visit(key, stack) {
    if (visited.has(key)) return;
    if (visiting.has(key)) {
      issues.push(`delegatedTaskPlan cycle detected at ${key}`);
      return;
    }
    visiting.add(key);
    const item = byKey.get(key);
    if (item?.dependsOn) {
      for (const dep of item.dependsOn) {
        if (!byKey.has(dep)) {
          issues.push(`dependsOn references unknown task "${dep}"`);
        } else {
          visit(dep, [...stack, key]);
        }
      }
    }
    visiting.delete(key);
    visited.add(key);
  }

  for (const key of byKey.keys()) visit(key, []);

  return issues;
}

function validateHandoff(data, manifest, strict) {
  const issues = [];
  if (!data.riskTier) issues.push("handoff missing riskTier");
  if (!TIER_ORDER.includes(data.riskTier)) issues.push(`invalid riskTier: ${data.riskTier}`);

  if (data.conditionalSkills) {
    for (const s of data.conditionalSkills) {
      if (!manifest.skillIds.includes(s)) issues.push(`unknown conditionalSkill: ${s}`);
    }
  }

  if (data.riskTier !== "T0" && data.requiresPoCheckpoint && !data.poCheckpoint) {
    issues.push("requiresPoCheckpoint true but poCheckpoint missing");
  }

  const plan = data.delegatedTaskPlan ?? [];
  const maxTasks = manifest.riskTiers[data.riskTier]?.maxDelegatedTasks ?? 16;

  if (plan.length > maxTasks) {
    issues.push(`delegatedTaskPlan has ${plan.length} tasks; max ${maxTasks} for ${data.riskTier}`);
  }

  for (const item of plan) {
    if (item.function) {
      if (!manifest.functionIds.includes(item.function)) {
        issues.push(`unknown function: ${item.function}`);
      }
      const fn = manifest.agentFunctions[item.function];
      if (fn && data.riskTier && !tierAtLeast(data.riskTier, fn.minRiskTier)) {
        issues.push(
          `function ${item.function} requires minRiskTier ${fn.minRiskTier}; handoff is ${data.riskTier}`,
        );
      }
    }
    if (item.riskTier && data.riskTier && !tierAtLeast(data.riskTier, item.riskTier)) {
      issues.push(`task riskTier ${item.riskTier} exceeds handoff ${data.riskTier}`);
    }
  }

  issues.push(...validateHandoffDag(plan));

  if (strict && data.suspectedPaths?.length) {
    const files = data.suspectedPaths;
    const { requiredLanes } = classifyFiles(files, manifest);
    const functionsInPlan = new Set(plan.map((p) => p.function).filter(Boolean));
    for (const lane of requiredLanes) {
      if (!functionsInPlan.has(lane)) {
        issues.push(`required lane "${lane}" missing from delegatedTaskPlan for suspected paths`);
      }
    }
  }

  if (strict) {
    const { issues: planIssues } = planFromHandoff(
      { ...data, delegatedTaskPlan: plan },
      manifest,
    );
    issues.push(...planIssues);
  }

  for (const msg of issues) console.error(`ERROR: ${msg}`);
  return strict && issues.length ? 1 : issues.length ? 0 : 0;
}

function cmdPlan(manifest, args) {
  const files = getDiffFiles(args.base);
  const { suggestedTier, suggestedLanes, requiredLanes, matchedTriggers } = classifyFiles(
    files,
    manifest,
  );

  const plan = [];
  if (suggestedTier !== "T0") {
    plan.push(
      { function: "scout", riskTier: suggestedTier, parallelGroup: "discover" },
      { function: "architect", riskTier: suggestedTier, parallelGroup: "discover", dependsOn: [] },
      {
        function: "builder",
        riskTier: suggestedTier,
        dependsOn: ["architect"],
      },
    );
    for (const lane of requiredLanes) {
      if (lane === "sentinel") {
        plan.push({
          function: "sentinel",
          riskTier: maxTier(suggestedTier, "T1"),
          dependsOn: ["builder"],
          parallelGroup: "validate",
        });
      }
    }
    if (!plan.some((p) => p.function === "sentinel")) {
      plan.push({
        function: "sentinel",
        riskTier: suggestedTier,
        dependsOn: ["builder"],
        parallelGroup: "validate",
      });
    }
    plan.push({
      function: "verifier",
      riskTier: suggestedTier,
      dependsOn: ["builder"],
      parallelGroup: "validate",
    });
    if (suggestedTier === "T4") {
      plan.push({ function: "finops_coordinator", riskTier: "T4" });
    }
    for (const lane of suggestedLanes) {
      if (["counsel", "custodian", "packaging", "release_ops", "ai_governance_reviewer", "mlops_reviewer"].includes(lane)) {
        if (!plan.some((p) => p.function === lane)) {
          plan.push({
            function: lane,
            riskTier: suggestedTier,
            dependsOn: ["custodian", "release_ops"].includes(lane) ? ["architect"] : [],
            readonly: lane !== "release_ops",
          });
        }
      }
    }
  }

  const payload = {
    riskTier: suggestedTier,
    runtimeProfile: manifest.runtimeProfile ?? "legacy",
    nativeCommands: manifest.nativeCommands ?? {},
    matchedTriggers,
    requiredLanes,
    suggestedLanes,
    delegatedTaskPlan: plan,
    tierPreamble: {
      riskTier: suggestedTier,
      poCheckpoint:
        suggestedTier === "T0"
          ? "step 1 chore N/A"
          : "Feature brief path ___ | UAC count ___ | gate Y/N | phase ADR: specs/alignment/decisions/0001-phase1-scope.md",
      phaseAdr: "specs/alignment/decisions/0001-phase1-scope.md",
    },
  };

  if (args.json || args.quiet) {
    console.log(JSON.stringify(payload));
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }

  if (args.strict && suggestedTier !== "T0" && !plan.some((p) => p.function === "sentinel")) {
    if (!args.quiet) console.error("ERROR: plan --strict requires sentinel lane for non-T0 work");
    return 1;
  }
  return 0;
}

function generatePrBody(manifest, args) {
  const files = getDiffFiles(args.base);
  const result = classifyFiles(files, manifest);

  const planOut = execSync(
    `node "${join(process.cwd(), "scripts", "governance-lint.mjs")}" plan --json --quiet --base ${args.base}`,
    { encoding: "utf8", cwd: process.cwd() },
  );
  const plan = JSON.parse(planOut);

  const lanes = plan.delegatedTaskPlan?.map((p) => p.function).join(", ") || "N/A";

  const body = `## Summary

<!-- 2–4 sentences -->

## Governance

- **riskTier:** ${plan.riskTier}
- **delegatedTaskPlan:** ${lanes}
- **Suggested tier (CI):** ${result.suggestedTier}
- **Runtime:** ${plan.runtimeProfile ?? "cursor-3-native"}

### PO orchestration checkpoint (required when riskTier ≥ T1; T0 use \`step 1 chore N/A\`)

\`\`\`
Feature brief / spike ADR: 
UAC count: 
PO gate complete: Y/N
Friction targets cited: Y/N/N/A
Phase ADR: specs/alignment/decisions/0001-phase1-scope.md
Payroll / Compliance / Math: N/A or brief path
\`\`\`

### Golden thread stub (required when riskTier ≥ T1)

| Risk or requirement | Control | Artifact path | Verifier | Legal (or N/A) | Compliance / kernel (or N/A) | QA / UAC # (or N/A) |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

## Agent lane sign-off (parallel — ADR 0011)

Complete lanes from delegatedTaskPlan; paste evidence links per lane:

- [ ] **scout** — exploration notes or N/A
- [ ] **architect** — \`specs/.../architecture-spec.md\` or N/A
- [ ] **builder** — implementation complete
- [ ] **sentinel** — \`security-review.md\`; no merge blockers
- [ ] **verifier** — \`qa-plan.md\` + CI evidence
- [ ] **counsel** — \`legal-checklist.md\` (T3+ regulated paths)
- [ ] **custodian** — migration runbook (T2+ DDL)
`;

  console.log(body);
  return 0;
}

function main() {
  const args = parseArgs(process.argv);

  try {
    const manifest = loadManifest();

    if (args.strict && manifest.version < 2) {
      console.error("ERROR: governance-manifest version must be >= 2 for strict mode");
      return 1;
    }

    if (args.command === "diff") {
      const files = getDiffFiles(args.base);
      if (files.length === 0) {
        console.log("governance-lint: no changed files detected");
        return args.strict ? 0 : 0;
      }
      const result = classifyFiles(files, manifest);
      console.log(`Suggested riskTier: ${result.suggestedTier}`);
      console.log(`Manifest version: ${manifest.version}`);
      if (result.matchedTriggers.length) {
        console.log("Matched path triggers:");
        for (const t of result.matchedTriggers) {
          console.log(`  - ${t.id} (${t.minTier}): ${t.file}`);
        }
      }
      if (result.requiredLanes.length) {
        console.log(`Required lanes: ${result.requiredLanes.join(", ")}`);
      }
      if (result.suggestedLanes.length) {
        console.log(`Suggested lanes: ${result.suggestedLanes.join(", ")}`);
      }
      if (result.suggestedSkills.length) {
        console.log(`Suggested skills: ${result.suggestedSkills.join(", ")}`);
      }
      console.log(
        `Files (${files.length}): ${files.slice(0, 10).join(", ")}${files.length > 10 ? "…" : ""}`,
      );
      if (args.strict) {
        return validateDiffStrict(result);
      }
      return 0;
    }

    if (args.command === "plan") {
      return cmdPlan(manifest, args);
    }

    if (args.command === "pr-body-generate") {
      return generatePrBody(manifest, args);
    }

    if (args.command === "pr-body") {
      let body = args.body;
      if (!body && process.env.GITHUB_EVENT_PATH && existsSync(process.env.GITHUB_EVENT_PATH)) {
        const ev = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
        body = ev.pull_request?.body ?? "";
      }
      if (!body && args.file) body = readFileSync(resolve(args.file), "utf8");
      if (!body) {
        try {
          body = readFileSync(0, "utf8");
        } catch {
          body = "";
        }
      }
      const files = getDiffFiles(args.base);
      const classification = classifyFiles(files, manifest);
      const { suggestedTier, requiredLanes } = classification;
      if (!body.trim() && !args.strict) {
        console.log("governance-lint: empty pr-body (skipped non-strict)");
        return 0;
      }
      if (!body.trim() && args.strict) {
        console.error("ERROR: pr-body empty");
        return 1;
      }
      return validatePrBody(body, suggestedTier, args.strict, {
        failOnUnderTier: args.failOnUnderTier,
        requiredLanes,
      });
    }

    if (args.command === "handoff") {
      const fallback = join(
        process.cwd(),
        "specs",
        "templates",
        "orchestrator-human-issue-handoff.example.json",
      );
      const paths = args.discover ? discoverHandoffFiles() : [];
      const filesToValidate =
        paths.length > 0 ? paths : args.file ? [resolve(args.file)] : args.discover ? [fallback] : [];

      if (!filesToValidate.length) {
        console.error("handoff requires --file or --discover");
        return 1;
      }

      if (args.discover && paths.length === 0) {
        console.log(`governance-lint: no discovered handoffs; validating ${fallback}`);
      }

      let exit = 0;
      for (const fp of filesToValidate) {
        const data = JSON.parse(readFileSync(fp, "utf8"));
        const code = validateHandoff(data, manifest, args.strict);
        if (code !== 0) exit = code;
      }

      if (args.strict && args.discover && paths.length === 0) {
        const diffFiles = getDiffFiles(args.base);
        const { requiredLanes, suggestedTier } = classifyFiles(diffFiles, manifest);
        if (tierAtLeast(suggestedTier, "T2") && requiredLanes.length > 0) {
          const diffFiles2 = getDiffFiles(args.base);
          const handoffData = JSON.parse(readFileSync(fallback, "utf8"));
          const plan = handoffData.delegatedTaskPlan ?? [];
          const functionsInPlan = new Set(plan.map((p) => p.function).filter(Boolean));
          for (const lane of requiredLanes) {
            if (!functionsInPlan.has(lane)) {
              console.error(
                `ERROR: example handoff missing lane "${lane}" required by diff (${suggestedTier}); add specs/**/orchestrator*.json handoff`,
              );
              exit = 1;
            }
          }
          void diffFiles2;
        }
      }

      return exit;
    }

    console.error(`Unknown command: ${args.command}`);
    return 1;
  } catch (err) {
    console.error(`governance-lint: ${err.message}`);
    return args.strict ? 1 : 0;
  }
}

process.exit(main());
