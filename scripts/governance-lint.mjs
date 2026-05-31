#!/usr/bin/env node
/**
 * governance-lint — risk-tier classifier, function-lane DAG, PR body validator
 * Manifest v4: YAML loader in governance-manifest.mjs
 *
 * Usage:
 *   node governance-lint.mjs diff [--base main] [--strict]
 *   node governance-lint.mjs pr-body [--file path] [--body text] [--strict]
 *   node governance-lint.mjs handoff --file handoff.json [--strict] [--discover]
 *   node governance-lint.mjs plan [--base main] [--strict] [--json] [--quiet]
 *   node governance-lint.mjs pr-body-generate [--base main]
 *   node governance-lint.mjs sync-check [--warn-only]
 *   node governance-lint.mjs team-map [--strict]
 */

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import {
  TIER_ORDER,
  loadManifest,
  classifyFiles,
  tierAtLeast,
  buildPlanFromExecutionGraph,
} from "./governance-manifest.mjs";
import { emitEvidenceSignal, matchRouterHints } from "./governance-learning.mjs";
import { buildCollaborationPlanStub, handoffRequiresRevalidationStrict } from "../.cursor/hooks/collaboration.mjs";

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
    warnOnly: false,
  };
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--strict") args.strict = true;
    else if (a === "--json") args.json = true;
    else if (a === "--quiet") args.quiet = true;
    else if (a === "--fail-on-under-tier") args.failOnUnderTier = true;
    else if (a === "--discover") args.discover = true;
    else if (a === "--warn-only") args.warnOnly = true;
    else if (a === "--base") args.base = argv[++i];
    else if (a === "--file") args.file = argv[++i];
    else if (a === "--body") args.body = argv[++i];
    else positional.push(a);
  }
  args.command = positional[0] ?? "diff";
  return args;
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
  if (/\.cursor\/plans\//i.test(body)) return true;
  const brief = body.match(/Feature brief[^:]*:\s*(\S+)/i);
  if (brief?.[1] && !PLACEHOLDER_RE.test(brief[1])) return true;
  return false;
}

function prBodyReferencesLane(body, lane) {
  const re = new RegExp(`\\*\\*${lane}\\*\\*|\\b${lane}\\b`, "i");
  return re.test(body);
}

function isHarnessOnlyDiff(files) {
  if (!files.length) return false;
  const harnessPrefixes = [
    ".cursor/",
    "scripts/governance",
    "docs/meta/cursor",
    "specs/governance/",
    "specs/alignment/decisions/001",
  ];
  return files.every((f) => harnessPrefixes.some((p) => f.startsWith(p)));
}

function hasValueDeliveryRecord(body, files = []) {
  if (/value delivery record:\s*harness\s*N\/A/i.test(body)) return isHarnessOnlyDiff(files);
  if (/value-delivery-record|valueDeliveryRecordPath/i.test(body)) return true;
  if (/specs\/[^\s]*value-delivery[^\s]*/i.test(body)) return true;
  return false;
}

function t3LaneSignoffsPresent(body) {
  const hasSentinel =
    /sentinel/i.test(body) &&
    (/\*\*sentinel\*\*[^\n]*\S{3,}/i.test(body) ||
      /\[x\]\s*\*\*sentinel\*\*/i.test(body) ||
      /sentinel[^\n]+security-review/i.test(body));
  const hasCounsel =
    /counsel/i.test(body) &&
    (/\*\*counsel\*\*[^\n]*\S{3,}/i.test(body) ||
      /\[x\]\s*\*\*counsel\*\*/i.test(body) ||
      /counsel[^\n]+legal-checklist/i.test(body));
  return hasSentinel && hasCounsel;
}

function validatePrBody(body, suggestedTier, strict, options = {}) {
  const { failOnUnderTier = false, requiredLanes = [], diffFiles = [] } = options;
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

  if (tierAtLeast(suggestedTier, "T4") && !body.match(/humanMergeGate|human merge gate/i)) {
    if (strict) issues.push("T4 PR must acknowledge human merge gate");
    else warnings.push("T4 PR should acknowledge human merge gate");
  }

  if (tierAtLeast(suggestedTier, "T1")) {
    if (!body.match(/Lifecycle \(S&OP|value delivery|value-delivery-record/i)) {
      const msg = "PR body missing Lifecycle (S&OP / value) section or value delivery record link";
      if (strict) issues.push(msg);
      else warnings.push(msg);
    }
    if (strict && !hasValueDeliveryRecord(body, diffFiles)) {
      issues.push(
        "PR body must link value-delivery-record (specs/.../value-delivery-record.md) or declare 'Value delivery record: harness N/A' for harness-only diffs",
      );
    }
  }

  if (strict && tierAtLeast(suggestedTier, "T3") && !t3LaneSignoffsPresent(body)) {
    issues.push(
      "T3+ PR body must document sentinel and counsel lane sign-off (checked box or artifact path)",
    );
  }

  for (const msg of warnings) console.warn(`WARN: ${msg}`);
  for (const msg of issues) console.error(`ERROR: ${msg}`);

  return strict && issues.length > 0 ? 1 : 0;
}

function walkJsonFiles(dir, out) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkJsonFiles(p, out);
    else if (name.endsWith(".json") && name.includes("orchestrator")) out.push(p);
  }
  return out;
}

function discoverHandoffFiles() {
  const specsDir = join(process.cwd(), "specs");
  return walkJsonFiles(specsDir, []).filter(
    (p) => !p.includes(`${join("specs", "templates")}`) && !p.endsWith(".schema.json"),
  );
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

  if (issues.length) {
    emitEvidenceSignal({
      kind: "ci_fail",
      riskTier: result.suggestedTier,
      pathClass: result.matchedTriggers[0]?.id ?? "unknown",
      source: { plane: "evidence", artifact: "governance-lint" },
      hypothesis: issues[0],
      detail: { issues, command: "diff-strict" },
    });
  }

  return issues.length > 0 ? 1 : 0;
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
        .filter((t) =>
          (manifest.pathTriggers.find((x) => x.id === t.id)?.requiredLanes ?? []).includes(lane),
        )
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

  function visit(key) {
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
          visit(dep);
        }
      }
    }
    visiting.delete(key);
    visited.add(key);
  }

  for (const key of byKey.keys()) visit(key);

  return issues;
}

function validateHandoff(data, manifest, strict) {
  const issues = [];
  if (!data.riskTier) issues.push("handoff missing riskTier");
  if (!TIER_ORDER.includes(data.riskTier)) issues.push(`invalid riskTier: ${data.riskTier}`);

  if (data.conditionalSkills) {
    for (const s of data.conditionalSkills) {
      if (!manifest.skillIds.includes(s)) issues.push(`unknown conditionalSkill: ${s}`);
      if (/^hr-erp-/i.test(s)) issues.push(`banned conditionalSkill: ${s}`);
    }
  }

  if (strict) {
    for (const msg of bannedContentIssues(JSON.stringify(data), "handoff")) {
      issues.push(msg);
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
    const { requiredLanes } = classifyFiles(data.suspectedPaths, manifest);
    const functionsInPlan = new Set(plan.map((p) => p.function).filter(Boolean));
    for (const lane of requiredLanes) {
      if (!functionsInPlan.has(lane)) {
        issues.push(`required lane "${lane}" missing from delegatedTaskPlan for suspected paths`);
      }
    }
  }

  if (strict) {
    const { issues: planIssues } = planFromHandoff({ ...data, delegatedTaskPlan: plan }, manifest);
    issues.push(...planIssues);
  }

  if (strict && tierAtLeast(data.riskTier, "T3") && !data.evidenceBundlePath) {
    issues.push("T3+ handoff requires evidenceBundlePath");
  }

  if (
    strict &&
    tierAtLeast(data.riskTier, "T2") &&
    data.valueDeliveryRecordPath &&
    !data.sopCycleId
  ) {
    issues.push("handoff with valueDeliveryRecordPath requires sopCycleId");
  }

  if (strict && data.evidenceBundlePath) {
    const bundlePath = join(process.cwd(), data.evidenceBundlePath);
    if (!existsSync(bundlePath)) {
      issues.push(`evidence bundle not found: ${data.evidenceBundlePath}`);
    }
  }

  const collabConfig = manifest.collaboration ?? {};
  const warnings = [];
  if (data.riskTier !== "T0" && collabConfig.enabled !== false) {
    const hasCollabPlan = Boolean(data.collaborationPlan?.decisionOverview);
    const hasPlanArtifact = Boolean(data.planModeArtifact || findPlanModeArtifact());
    if (!hasCollabPlan && !hasPlanArtifact) {
      warnings.push(
        "advisory: T1+ handoff should include collaborationPlan or .cursor/plans/*.md (Collaboration plane)",
      );
    }
    if (strict && handoffRequiresRevalidationStrict(data.riskTier, collabConfig)) {
      if (!data.revalidationConfirmed && !data.collaborationPlan?.revalidationConfirmed) {
        issues.push("T3+ strict: handoff requires revalidationConfirmed: true (Collaboration plane)");
      }
      const record = data.humanDecisionRecord ?? data.collaborationPlan?.humanDecisionRecord;
      const principal = record?.principal ?? data.principal;
      if (!principal) {
        issues.push("T3+ strict: humanDecisionRecord.principal required");
      }
      const outputReviewPassed =
        data.outputReviewPassed ||
        data.collaborationPlan?.outputReviewPassed ||
        (data.laneSignoffPath &&
          (() => {
            try {
              const signoff = JSON.parse(readFileSync(join(process.cwd(), data.laneSignoffPath), "utf8"));
              return (signoff.lanes ?? []).some((l) => l.function === "verifier" && l.status === "complete");
            } catch {
              return false;
            }
          })());
      if (!outputReviewPassed) {
        issues.push(
          "T3+ strict: outputReviewPassed or verifier lane sign-off required (Collaboration phase 7)",
        );
      }
    }
  }

  for (const msg of warnings) console.error(`WARN: ${msg}`);
  if (strict && (data.laneSignoffPath || data.evidenceBundlePath)) {
    const signoffPath = data.laneSignoffPath
      ? join(process.cwd(), data.laneSignoffPath)
      : null;
    if (signoffPath && !existsSync(signoffPath)) {
      issues.push(`lane signoff not found: ${data.laneSignoffPath}`);
    } else if (signoffPath) {
      try {
        const signoff = JSON.parse(readFileSync(signoffPath, "utf8"));
        const functionsInPlan = new Set(plan.map((p) => p.function).filter(Boolean));
        const attested = new Set((signoff.lanes ?? []).map((l) => l.function));
        for (const lane of functionsInPlan) {
          if (!attested.has(lane)) {
            issues.push(`lane signoff missing attestation for "${lane}"`);
          }
        }
      } catch {
        issues.push(`invalid lane signoff JSON: ${data.laneSignoffPath}`);
      }
    }
  }

  for (const msg of issues) console.error(`ERROR: ${msg}`);

  if (strict && issues.length) {
    emitEvidenceSignal({
      kind: issues.some((m) => m.includes("riskTier")) ? "tier_mismatch" : "composition_miss",
      riskTier: data.riskTier,
      pathClass: data.suspectedPaths?.length
        ? classifyFiles(data.suspectedPaths, manifest).matchedTriggers[0]?.id
        : "unknown",
      plannedLanes: plan.map((p) => p.function).filter(Boolean),
      source: { plane: "evidence", artifact: "governance-lint" },
      hypothesis: issues[0],
      metrics: {
        compositionMiss: issues.some((m) => m.includes("lane") || m.includes("delegatedTaskPlan")),
        executionGap: issues.some((m) => m.includes("dependsOn")),
      },
      detail: { issues: issues.slice(0, 5) },
    });
  }

  return strict && issues.length ? 1 : 0;
}

const BANNED_HANDOFF_PATTERNS = [
  { re: /@hr-erp-/i, msg: "banned legacy skill invoke @hr-erp-*" },
  { re: /\.cursor\/skills\/hr-erp-/i, msg: "banned legacy skill path" },
  { re: /_archived\/2026-05-28-revamp/, msg: "banned archived skill path _archived/2026-05-28-revamp" },
];

function bannedContentIssues(text, label) {
  const issues = [];
  for (const { re, msg } of BANNED_HANDOFF_PATTERNS) {
    if (re.test(text)) issues.push(`${label}: ${msg}`);
  }
  return issues;
}

function walkMarkdownFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const fp = join(dir, name);
    const st = statSync(fp);
    if (st.isDirectory()) {
      if (name === "_archived" || name.startsWith("_archived")) continue;
      walkMarkdownFiles(fp, out);
    } else if (name.endsWith(".md")) out.push(fp);
  }
  return out;
}

function cmdTeamMap(manifest, args) {
  let exit = 0;
  const teamMap = join(process.cwd(), "docs", "meta", "agent-team-map.md");
  if (!existsSync(teamMap)) {
    console.error("ERROR: missing docs/meta/agent-team-map.md");
    exit = 1;
  } else {
    console.log("OK: agent-team-map.md present");
  }

  const skillsDir = join(process.cwd(), ".cursor", "skills");
  for (const [skillId, meta] of Object.entries(manifest.skills ?? {})) {
    if (meta.portable) continue;
    const skillPath = join(skillsDir, skillId, "SKILL.md");
    if (!existsSync(skillPath)) {
      console.error(`ERROR: project skill missing on disk: ${skillId}`);
      exit = 1;
    } else {
      console.log(`OK: skill on disk: ${skillId}`);
    }
  }

  for (const id of manifest.skillIds ?? []) {
    if (!manifest.skills?.[id]) {
      console.error(`ERROR: skillIds entry "${id}" not in manifest.skills`);
      exit = 1;
    }
  }

  if (args.strict) {
    for (const fp of walkMarkdownFiles(skillsDir)) {
      const body = readFileSync(fp, "utf8");
      for (const msg of bannedContentIssues(body, fp.replace(process.cwd() + "/", ""))) {
        console.error(`ERROR: ${msg}`);
        exit = 1;
      }
    }
  }

  return exit;
}

function findPlanModeArtifact() {
  const plansDir = join(process.cwd(), ".cursor", "plans");
  if (!existsSync(plansDir)) return null;
  const files = readdirSync(plansDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => join(plansDir, f));
  if (!files.length) return null;
  files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return files[0].replace(process.cwd() + "/", "");
}

function loadSessionLaneState() {
  const path = join(process.cwd(), ".cursor", "hooks-output", "session-lane-state.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function cmdPlan(manifest, args) {
  const files = getDiffFiles(args.base);
  const { suggestedTier, suggestedLanes, requiredLanes, matchedTriggers, suggestedSkills } = classifyFiles(
    files,
    manifest,
  );

  const plan = buildPlanFromExecutionGraph({
    manifest,
    suggestedTier,
    requiredLanes,
    matchedTriggers,
  });

  const payload = {
    riskTier: suggestedTier,
    schema: manifest.schema,
    runtimeProfile: manifest.runtimeProfile ?? "legacy",
    nativeCommands: manifest.nativeCommands ?? {},
    matchedTriggers,
    requiredLanes,
    suggestedLanes,
    suggestedSkills,
    delegatedTaskPlan: plan,
    regulatedGraph: matchedTriggers.some((t) =>
      ["compliance_pay_time", "ai_governance", "mlops_inference", "product_runtime_mcp", "harness_foundation"].includes(
        t.id,
      ),
    ),
    routerHintsActive: matchRouterHints(files, manifest.adaptation, suggestedTier).map((h) => ({
      id: h.id,
      prefer: h.prefer,
      status: h.status,
    })),
    tierPreamble: {
      riskTier: suggestedTier,
      poCheckpoint:
        suggestedTier === "T0"
          ? "step 1 chore N/A"
          : "Feature brief path ___ | UAC count ___ | gate Y/N | phase ADR: specs/alignment/decisions/0001-phase1-scope.md",
      phaseAdr: "specs/alignment/decisions/0001-phase1-scope.md",
      planModeArtifact: findPlanModeArtifact(),
    },
    collaborationPlan: buildCollaborationPlanStub({ matchedTriggers }, suggestedTier),
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
  const sessionState = loadSessionLaneState();
  const planArtifact = findPlanModeArtifact();

  const lanes = plan.delegatedTaskPlan?.map((p) => p.function).join(", ") || "N/A";
  const completedLanes =
    sessionState?.completed?.map((c) => c.function).join(", ") || "N/A (session state not recorded)";

  const learningReport = join(process.cwd(), "specs", "governance", "learning", "reports");
  let reflectNote = "";
  if (existsSync(learningReport)) {
    const reports = readdirSync(learningReport)
      .filter((f) => f.endsWith("-reflect.json"))
      .sort()
      .reverse();
    if (reports[0]) reflectNote = `\n- **Latest reflect report:** specs/governance/learning/reports/${reports[0]}`;
  }

  const gapNote = sessionState?.signalsEmitted?.length
    ? `\n- **Harness signals (session):** ${sessionState.signalsEmitted.length} emitted`
    : "";

  const body = `## Summary

<!-- 2–4 sentences -->

## Governance

- **riskTier:** ${plan.riskTier}
- **delegatedTaskPlan:** ${lanes}
- **Completed lanes (session):** ${completedLanes}
- **Suggested tier (CI):** ${result.suggestedTier}
- **Runtime:** ${plan.runtimeProfile ?? "cursor-3-native"}
- **Regulated graph:** ${plan.regulatedGraph ? "yes" : "no"}
${planArtifact ? `- **Plan Mode artifact:** ${planArtifact}` : ""}${reflectNote}${gapNote}

### Harness delta (Adaptation plane)

- New friction / ledger signal? Y/N → signal_id: ___

### PO orchestration checkpoint (required when riskTier ≥ T1; T0 use \`step 1 chore N/A\`)

\`\`\`
Feature brief / spike ADR / Plan Mode: ${planArtifact ?? ""}
UAC count: 
PO gate complete: Y/N
Friction targets cited: Y/N/N/A
Phase ADR: specs/alignment/decisions/0001-phase1-scope.md
Payroll / Compliance / Math: N/A or brief path
\`\`\`

### Lifecycle (S&OP / value delivery)

- Demand (S&OP): feature brief or Plan Mode path above
- Supply (IBP): lane completion from handoff / session state
- Delivery: UAC checklist + CI evidence → specs/templates/value-delivery-record.md

### Evidence bundle (required when riskTier ≥ T3)

- Bundle: \`npm run governance:evidence:collect -- --handoff specs/.../orchestrator-handoff.json --principal "Name"\`
- Lane sign-offs: specs/governance/evidence/lane-signoffs/

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
- [ ] **release_ops** — CI/deploy evidence (T2+ ops paths)
- [ ] **ai_governance_reviewer** — MCP/Cedar review (T3+ copilot)
`;

  console.log(body);
  return 0;
}

function cmdSyncCheck(args) {
  const repoManifest = join(process.cwd(), ".cursor", "governance", "governance-manifest.yaml");
  const globalManifest = join(homedir(), ".cursor", "governance", "governance-manifest.yaml");
  const repoLint = join(process.cwd(), "scripts", "governance-lint.mjs");
  const globalLint = join(homedir(), ".cursor", "scripts", "governance-lint.mjs");

  let exit = 0;
  for (const [label, a, b] of [
    ["manifest", repoManifest, globalManifest],
    ["governance-lint.mjs", repoLint, globalLint],
  ]) {
    if (!existsSync(a)) {
      console.warn(`WARN: missing repo ${label}: ${a}`);
      continue;
    }
    if (!existsSync(b)) {
      console.warn(`WARN: missing global ${label}: ${b} (skip sync)`);
      continue;
    }
    const ha = createHash("sha256").update(readFileSync(a)).digest("hex");
    const hb = createHash("sha256").update(readFileSync(b)).digest("hex");
    if (ha !== hb) {
      const msg = `${label} drift: repo ${ha.slice(0, 12)}… vs global ${hb.slice(0, 12)}…`;
      if (args.warnOnly) console.warn(`WARN: ${msg}`);
      else {
        console.error(`ERROR: ${msg}`);
        exit = 1;
      }
    } else {
      console.log(`OK: ${label} in sync (${ha.slice(0, 12)}…)`);
    }
  }
  return exit;
}

async function main() {
  const args = parseArgs(process.argv);

  try {
    if (args.command === "sync-check") {
      return cmdSyncCheck(args);
    }

    const manifest = loadManifest();

    if (args.command === "team-map") {
      return cmdTeamMap(manifest, args);
    }

    if (args.strict && manifest.version < 2) {
      console.error("ERROR: governance-manifest version must be >= 2 for strict mode");
      return 1;
    }

    if (args.command === "diff") {
      const files = getDiffFiles(args.base);
      if (files.length === 0) {
        console.log("governance-lint: no changed files detected");
        return 0;
      }
      const result = classifyFiles(files, manifest);
      console.log(`Suggested riskTier: ${result.suggestedTier}`);
      console.log(`Manifest version: ${manifest.version} (${manifest.schema})`);
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
        diffFiles: files,
      });
    }

    if (args.command === "handoff") {
      const examplePath = join(
        process.cwd(),
        "specs",
        "templates",
        "orchestrator-human-issue-handoff.example.json",
      );
      const discovered = args.discover ? discoverHandoffFiles() : [];
      const filesToValidate = discovered.length
        ? discovered
        : args.file
          ? [resolve(args.file)]
          : args.discover
            ? [examplePath]
            : [];

      if (!filesToValidate.length) {
        console.error("handoff requires --file or --discover");
        return 1;
      }

      if (args.discover && discovered.length === 0) {
        console.log("governance-lint: no discovered handoffs under specs/");
        if (args.strict) {
          const diffFiles = getDiffFiles(args.base);
          const { requiredLanes, suggestedTier } = classifyFiles(diffFiles, manifest);
          if (tierAtLeast(suggestedTier, "T2") && requiredLanes.length > 0) {
            console.error(
              `ERROR: T2+ diff requires specs/**/orchestrator*.json handoff with lanes: ${requiredLanes.join(", ")}`,
            );
            return 1;
          }
        }
        console.log(`governance-lint: validating schema fixture ${examplePath}`);
        const data = JSON.parse(readFileSync(examplePath, "utf8"));
        return validateHandoff(data, manifest, args.strict);
      }

      let exit = 0;
      for (const fp of filesToValidate) {
        if (!args.quiet) console.log(`Validating handoff: ${fp}`);
        const data = JSON.parse(readFileSync(fp, "utf8"));
        const code = validateHandoff(data, manifest, args.strict);
        if (code !== 0) exit = code;
      }

      if (args.strict && !args.discover && args.file === examplePath) {
        /* schema fixture only */
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

process.exit(await main());
