/**
 * Load and merge governance manifest v4 (YAML) + project overlay.
 */
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

export const TIER_ORDER = ["T0", "T1", "T2", "T3", "T4"];

const REGULATED_TRIGGER_IDS = new Set([
  "compliance_pay_time",
  "ai_governance",
  "mlops_inference",
  "product_runtime_mcp",
  "harness_foundation",
]);

export function resolveManifestPath() {
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

function normalizeTrigger(raw) {
  if (!raw?.id || !raw?.paths?.length) return null;
  return {
    id: raw.id,
    minTier: raw.minTier ?? raw.minRiskTier ?? "T1",
    paths: raw.paths,
    attachSkills: raw.attachSkills ?? [],
    attachAgentRules: raw.attachAgentRules ?? [],
    requiredLanes: raw.requiredLanes ?? [],
  };
}

function mergePathTriggers(base, overlay) {
  const byId = new Map(base.map((t) => [t.id, { ...t }]));
  for (const raw of overlay) {
    const t = normalizeTrigger(raw);
    if (!t) continue;
    const existing = byId.get(t.id);
    if (!existing) {
      byId.set(t.id, t);
      continue;
    }
    byId.set(t.id, {
      ...existing,
      minTier: maxTier(existing.minTier, t.minTier),
      paths: [...new Set([...existing.paths, ...t.paths])],
      attachSkills: [...new Set([...(existing.attachSkills ?? []), ...(t.attachSkills ?? [])])],
      attachAgentRules: [
        ...new Set([...(existing.attachAgentRules ?? []), ...(t.attachAgentRules ?? [])]),
      ],
      requiredLanes: [...new Set([...(existing.requiredLanes ?? []), ...(t.requiredLanes ?? [])])],
    });
  }
  return [...byId.values()];
}

function parseAgentFunctions(raw) {
  const agentFunctions = {};
  if (!raw?.agentFunctions) return agentFunctions;
  for (const [name, body] of Object.entries(raw.agentFunctions)) {
    if (!body?.minRiskTier) continue;
    agentFunctions[name] = {
      minRiskTier: body.minRiskTier,
      agentRule: body.agentRule === null ? null : body.agentRule,
      readonly: body.readonly ?? false,
    };
  }
  return agentFunctions;
}

function parseRiskTiers(raw) {
  const riskTiers = {};
  if (!raw?.riskTiers) return riskTiers;
  for (const t of TIER_ORDER) {
    const tier = raw.riskTiers[t];
    if (tier?.maxDelegatedTasks != null) {
      riskTiers[t] = { maxDelegatedTasks: tier.maxDelegatedTasks };
    }
  }
  return riskTiers;
}

function parseAdaptation(raw) {
  if (!raw?.adaptation) return { enabled: false, skillRouterHints: [] };
  const a = raw.adaptation;
  return {
    enabled: a.enabled === true,
    skillRouterHints: (a.skillRouterHints ?? []).map((h) => ({
      id: h.id,
      pathPattern: h.pathPattern,
      prefer: h.prefer ?? [],
      deprioritize: h.deprioritize ?? [],
      minTier: h.minTier ?? "T1",
      sourceSignalIds: h.sourceSignalIds ?? [],
      status: h.status ?? "shadow",
    })),
  };
}

function mergeAdaptation(base, overlay) {
  if (!overlay?.enabled && !overlay?.skillRouterHints?.length) return base;
  const byId = new Map((base.skillRouterHints ?? []).map((h) => [h.id, h]));
  for (const hint of overlay.skillRouterHints ?? []) {
    byId.set(hint.id, hint);
  }
  return {
    enabled: base.enabled || overlay.enabled === true,
    skillRouterHints: [...byId.values()],
  };
}

function parseFrameworkSkills(raw) {
  const out = {};
  if (!raw?.frameworkSkills) return out;
  for (const [id, cfg] of Object.entries(raw.frameworkSkills)) {
    out[id] = {
      paths: cfg.paths ?? [],
      minTier: cfg.minRiskTier ?? cfg.minTier ?? "T1",
      coLoad: cfg.coLoad ?? [],
    };
  }
  return out;
}

export function parseManifestDocument(raw, path = "") {
  const doc = typeof raw === "string" ? parseYaml(raw) : raw;
  const pathTriggers = (doc.pathTriggers ?? []).map(normalizeTrigger).filter(Boolean);

  return {
    version: doc.version ?? 1,
    schema: doc.schema ?? "governance-manifest/v1",
    runtimeProfile: doc.runtimeProfile ?? null,
    hookEnforcement: doc.hookEnforcement === true,
    maxSkillBodiesGlobal: doc.maxSkillBodies ?? 2,
    nativeCommands: doc.nativeCommands ?? {},
    executionGraph: doc.executionGraph ?? {},
    pathTriggers,
    frameworkSkills: parseFrameworkSkills(doc),
    skillIds: doc.skillIds ?? [],
    skills: doc.skills ?? {},
    agentRules: doc.agentRules ?? {},
    functionIds: doc.functionIds ?? [],
    agentFunctions: parseAgentFunctions(doc),
    riskTiers: parseRiskTiers(doc),
    taskBundles: doc.taskBundles ?? {},
    adaptation: parseAdaptation(doc),
    path,
  };
}

export function loadManifest() {
  const path = resolveManifestPath();
  const parsed = parseManifestDocument(readFileSync(path, "utf8"), path);

  const overlayPath = join(process.cwd(), ".cursor", "governance-overlay.yaml");
  if (existsSync(overlayPath)) {
    const overlayDoc = parseYaml(readFileSync(overlayPath, "utf8"));
    const overlayTriggers = (overlayDoc.additionalPathTriggers ?? [])
      .map(normalizeTrigger)
      .filter(Boolean);
    if (overlayTriggers.length) {
      parsed.pathTriggers = mergePathTriggers(parsed.pathTriggers, overlayTriggers);
    }
    parsed.adaptation = mergeAdaptation(parsed.adaptation, parseAdaptation(overlayDoc));
  }

  return parsed;
}

export function maxTier(a, b) {
  return TIER_ORDER.indexOf(a) >= TIER_ORDER.indexOf(b) ? a : b;
}

export function tierAtLeast(actual, required) {
  return TIER_ORDER.indexOf(actual) >= TIER_ORDER.indexOf(required);
}

export function globToRegExp(glob) {
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

export function matchPath(file, pattern) {
  const normalized = file.replace(/\\/g, "/");
  const pat = pattern.replace(/\\/g, "/");
  if (pat.includes("*")) {
    return globToRegExp(pat).test(normalized) || normalized.startsWith(pat.replace(/\*\*$/, ""));
  }
  return normalized === pat || normalized.startsWith(pat + "/");
}

export function buildSuggestedLanes(tier, requiredLanes, matchedTriggers) {
  const lanes = new Set(["scout", "architect", "builder", "sentinel", "verifier"]);
  for (const l of requiredLanes) lanes.add(l);

  const ids = new Set(matchedTriggers.map((t) => t.id));
  if (ids.has("ddl_migrations") || ids.has("hr_bounded_context_migrations")) {
    lanes.add("custodian");
  }
  if (ids.has("packaging_supply_chain")) lanes.add("packaging");
  if (ids.has("devops_lifecycle") || ids.has("hr_devops_framework_docs")) lanes.add("release_ops");
  if (ids.has("nextjs_app_router") || ids.has("contract_schemas")) lanes.add("architect");
  if (ids.has("prisma_stack")) lanes.add("custodian");
  if (ids.has("test_stack")) lanes.add("verifier");
  if (
    ids.has("compliance_pay_time") ||
    ids.has("ai_governance") ||
    ids.has("mlops_inference") ||
    ids.has("product_runtime_mcp") ||
    ids.has("harness_foundation")
  ) {
    lanes.add("counsel");
  }
  if (ids.has("ai_governance") || ids.has("product_runtime_mcp") || ids.has("harness_foundation")) {
    lanes.add("ai_governance_reviewer");
  }
  if (ids.has("mlops_inference")) lanes.add("mlops_reviewer");
  if (ids.has("product_runtime_mcp") || ids.has("harness_foundation")) {
    lanes.add("sentinel");
  }
  if (tier === "T4") lanes.add("finops_coordinator");

  return [...lanes];
}

export function classifyFiles(files, manifest) {
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

  for (const [skillId, fw] of Object.entries(manifest.frameworkSkills ?? {})) {
    for (const file of files) {
      for (const pattern of fw.paths ?? []) {
        if (matchPath(file, pattern)) {
          suggestedTier = maxTier(suggestedTier, fw.minTier);
          suggestedSkills.add(skillId);
          for (const co of fw.coLoad ?? []) suggestedSkills.add(co);
        }
      }
    }
  }

  const suggestedLanes = buildSuggestedLanes(
    suggestedTier,
    [...requiredLanes],
    matchedTriggers,
  );

  return {
    suggestedTier,
    matchedTriggers,
    suggestedSkills: [...suggestedSkills],
    requiredLanes: [...requiredLanes],
    suggestedLanes,
  };
}

function planHasFunction(plan, fn) {
  return plan.some((p) => p.function === fn);
}

function insertBeforeFunction(plan, targetFn, item) {
  if (!targetFn) {
    plan.push(item);
    return;
  }
  const idx = plan.findIndex((p) => p.function === targetFn);
  if (idx >= 0) plan.splice(idx, 0, item);
  else plan.push(item);
}

export function usesRegulatedGraph(matchedTriggers) {
  return matchedTriggers.some((t) => REGULATED_TRIGGER_IDS.has(t.id));
}

export function buildPlanFromExecutionGraph({
  manifest,
  suggestedTier,
  requiredLanes,
  matchedTriggers,
}) {
  if (suggestedTier === "T0") return [];

  const ids = new Set(matchedTriggers.map((t) => t.id));
  const regulated = usesRegulatedGraph(matchedTriggers);
  const graph = regulated
    ? manifest.executionGraph?.regulated ?? manifest.executionGraph?.default ?? []
    : manifest.executionGraph?.default ?? [];

  const plan = [];

  for (const step of graph) {
    if (step.parallel) {
      const group = step.parallel.includes("sentinel") ? "validate" : "discover";
      for (const fn of step.parallel) {
        plan.push({
          function: fn,
          riskTier: suggestedTier,
          parallelGroup: group,
          dependsOn: group === "validate" ? ["builder"] : [],
        });
      }
    }
    if (step.run) {
      plan.push({
        function: step.run,
        riskTier: suggestedTier,
        dependsOn: step.dependsOn ?? [],
      });
    }
  }

  if (ids.has("ddl_migrations") || ids.has("hr_bounded_context_migrations")) {
    if (!planHasFunction(plan, "custodian")) {
      insertBeforeFunction(plan, "builder", {
        function: "custodian",
        riskTier: maxTier(suggestedTier, "T2"),
        dependsOn: ["architect"],
        readonly: true,
      });
    }
  }

  if (ids.has("packaging_supply_chain") && !planHasFunction(plan, "packaging")) {
    insertBeforeFunction(plan, "builder", {
      function: "packaging",
      riskTier: maxTier(suggestedTier, "T2"),
      dependsOn: ["architect"],
      readonly: true,
    });
  }

  if (ids.has("devops_lifecycle") || ids.has("hr_devops_framework_docs")) {
    if (!planHasFunction(plan, "release_ops")) {
      insertBeforeFunction(plan, "builder", {
        function: "release_ops",
        riskTier: maxTier(suggestedTier, "T2"),
        dependsOn: ["architect"],
      });
    }
  }

  if (
    (ids.has("ai_governance") || ids.has("product_runtime_mcp") || ids.has("harness_foundation")) &&
    !planHasFunction(plan, "ai_governance_reviewer")
  ) {
    insertBeforeFunction(plan, "builder", {
      function: "ai_governance_reviewer",
      riskTier: maxTier(suggestedTier, "T3"),
      dependsOn: ["architect"],
      readonly: true,
    });
  }

  if (ids.has("mlops_inference") && !planHasFunction(plan, "mlops_reviewer")) {
    insertBeforeFunction(plan, "builder", {
      function: "mlops_reviewer",
      riskTier: maxTier(suggestedTier, "T3"),
      dependsOn: ["architect"],
      readonly: true,
    });
  }

  for (const lane of requiredLanes) {
    if (
      [
        "counsel",
        "custodian",
        "packaging",
        "release_ops",
        "ai_governance_reviewer",
        "mlops_reviewer",
        "sentinel",
      ].includes(lane) &&
      !planHasFunction(plan, lane)
    ) {
      const readonly = lane !== "release_ops";
      const dependsOn =
        lane === "sentinel" || lane === "verifier"
          ? ["builder"]
          : ["architect"];
      insertBeforeFunction(
        plan,
        lane === "sentinel" || lane === "verifier" ? undefined : "builder",
        {
          function: lane,
          riskTier: suggestedTier,
          dependsOn,
          readonly,
          parallelGroup:
            lane === "sentinel" || lane === "verifier" ? "validate" : undefined,
        },
      );
    }
  }

  if (!planHasFunction(plan, "sentinel")) {
    plan.push({
      function: "sentinel",
      riskTier: maxTier(suggestedTier, "T1"),
      dependsOn: ["builder"],
      parallelGroup: "validate",
      readonly: true,
    });
  }
  if (!planHasFunction(plan, "verifier")) {
    plan.push({
      function: "verifier",
      riskTier: suggestedTier,
      dependsOn: ["builder"],
      parallelGroup: "validate",
    });
  }

  if (suggestedTier === "T4" && !planHasFunction(plan, "finops_coordinator")) {
    plan.push({ function: "finops_coordinator", riskTier: "T4", dependsOn: ["builder"] });
  }

  return plan;
}
