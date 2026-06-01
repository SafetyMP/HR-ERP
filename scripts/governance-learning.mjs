#!/usr/bin/env node
/**
 * governance-learning — Adaptation plane (Reflective Governance Fabric)
 *
 * Usage:
 *   node governance-learning.mjs validate [--file path]
 *   node governance-learning.mjs reflect [--dry-run] [--import inbox/*.jsonl]
 *   node governance-learning.mjs promote --tier L1|L2|L3 --stub path --principal name [--skill id] [--adr path] [--control-plan path] [--dry-run]
 *   node governance-learning.mjs improve define|measure|analyze|control [options]
 */
import { randomUUID } from "node:crypto";
import { writeEnforcementProfileFile } from "./governance-enforcement-profile.mjs";
import { execSync } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { matchPath, tierAtLeast } from "./governance-manifest.mjs";

export const SIGNAL_KINDS = [
  "hook_deny",
  "lane_gap",
  "ci_fail",
  "friction",
  "composition_miss",
  "tier_mismatch",
  "cost_spike",
];

export const SIGNAL_STATUSES = ["open", "shadow", "promoted", "rejected"];

export const NON_LEARNABLE_PATHS = [
  ".cursor/rules/repo-boundaries.mdc",
  "docs/architecture/bounded-contexts.md",
  "specs/alignment/decisions/0001-phase1-scope.md",
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function repoRoot() {
  return process.cwd();
}

export function ledgerPath() {
  return join(repoRoot(), ".cursor", "hooks-output", "learning-ledger.jsonl");
}

export function learningRoot() {
  return join(repoRoot(), "specs", "governance", "learning");
}

function loadHookRollout() {
  const path = join(repoRoot(), ".cursor", "governance", "hook-mode.json");
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")).v4Rollout ?? {};
  } catch {
    return {};
  }
}

export function shouldEmitLearning() {
  if (process.env.GOVERNANCE_LEARNING_EMIT === "0") return false;
  if (process.env.GOVERNANCE_LEARNING_EMIT === "1") return true;
  if (process.env.CI === "true" || process.env.CI === "1") return true;
  const rollout = loadHookRollout();
  const from = rollout.learningLedgerEmitFrom;
  if (!from) return true;
  return Date.now() >= Date.parse(`${from}T00:00:00.000Z`);
}

export function shouldRouterHintsShadow() {
  const rollout = loadHookRollout();
  const from = rollout.routerHintsShadowFrom;
  if (!from) return false;
  return Date.now() >= Date.parse(`${from}T00:00:00.000Z`);
}

export function shouldRouterHintsEnforce() {
  const rollout = loadHookRollout();
  const from = rollout.routerHintsEnforceFrom;
  if (!from) return false;
  return Date.now() >= Date.parse(`${from}T00:00:00.000Z`);
}

export function validateSignal(obj) {
  const issues = [];
  if (!obj || typeof obj !== "object") {
    return { ok: false, issues: ["signal must be an object"] };
  }
  if (!obj.signal_id || !UUID_RE.test(obj.signal_id)) {
    issues.push("signal_id must be a UUID");
  }
  if (!obj.ts || Number.isNaN(Date.parse(obj.ts))) {
    issues.push("ts must be ISO date-time");
  }
  if (!SIGNAL_KINDS.includes(obj.kind)) {
    issues.push(`kind must be one of: ${SIGNAL_KINDS.join(", ")}`);
  }
  if (!SIGNAL_STATUSES.includes(obj.status)) {
    issues.push(`status must be one of: ${SIGNAL_STATUSES.join(", ")}`);
  }
  if (!obj.source?.plane || !["runtime", "evidence"].includes(obj.source.plane)) {
    issues.push("source.plane must be runtime or evidence");
  }
  if (!obj.source?.artifact) {
    issues.push("source.artifact required");
  }
  if (obj.riskTier && !["T0", "T1", "T2", "T3", "T4"].includes(obj.riskTier)) {
    issues.push("invalid riskTier");
  }
  return { ok: issues.length === 0, issues };
}

export function normalizeSignal(partial) {
  return {
    signal_id: partial.signal_id ?? randomUUID(),
    ts: partial.ts ?? new Date().toISOString(),
    status: partial.status ?? "open",
    ...partial,
  };
}

export function appendSignal(partial, options = {}) {
  if (!shouldEmitLearning()) return null;

  const signal = normalizeSignal(partial);
  const { ok, issues } = validateSignal(signal);
  if (!ok) {
    if (options.warnOnly) {
      console.warn(`governance-learning: skip invalid signal: ${issues.join("; ")}`);
      return null;
    }
    throw new Error(`Invalid signal: ${issues.join("; ")}`);
  }

  const dedupeKey =
    options.dedupeKey ??
    `${signal.kind}:${signal.pathClass ?? ""}:${JSON.stringify(signal.detail ?? {}).slice(0, 80)}`;

  if (options.state?.signalsEmitted?.includes(dedupeKey)) {
    return null;
  }

  const dir = join(repoRoot(), ".cursor", "hooks-output");
  mkdirSync(dir, { recursive: true });
  appendFileSync(ledgerPath(), JSON.stringify(signal) + "\n");

  if (options.state) {
    if (!options.state.signalsEmitted) options.state.signalsEmitted = [];
    options.state.signalsEmitted.push(dedupeKey);
  }

  return signal;
}

export function readLedgerFiles(extraPaths = []) {
  const paths = [];
  const local = ledgerPath();
  if (existsSync(local)) paths.push(local);

  const inbox = join(learningRoot(), "inbox");
  if (existsSync(inbox)) {
    for (const name of readdirSync(inbox)) {
      if (name.endsWith(".jsonl")) paths.push(join(inbox, name));
    }
  }

  for (const p of extraPaths) {
    if (existsSync(p)) paths.push(p);
  }

  return paths;
}

export function readSignals(filters = {}) {
  const signals = [];
  for (const fp of readLedgerFiles(filters.importPaths ?? [])) {
    const lines = readFileSync(fp, "utf8").split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        signals.push(JSON.parse(line));
      } catch {
        /* skip bad line */
      }
    }
  }

  return signals.filter((s) => {
    if (filters.kind && s.kind !== filters.kind) return false;
    if (filters.pathClass && s.pathClass !== filters.pathClass) return false;
    if (filters.status && s.status !== filters.status) return false;
    if (filters.since && Date.parse(s.ts) < Date.parse(filters.since)) return false;
    return true;
  });
}

export function aggregateByPathClass(signals) {
  const map = new Map();
  for (const s of signals) {
    const key = `${s.pathClass ?? "unknown"}::${s.kind}`;
    const row = map.get(key) ?? {
      pathClass: s.pathClass ?? "unknown",
      kind: s.kind,
      count: 0,
      riskTiers: {},
      signalIds: [],
    };
    row.count++;
    if (s.riskTier) row.riskTiers[s.riskTier] = (row.riskTiers[s.riskTier] ?? 0) + 1;
    row.signalIds.push(s.signal_id);
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

function tierSeverityScore(riskTiers) {
  const order = { T4: 5, T3: 4, T2: 3, T1: 2, T0: 1 };
  return Object.entries(riskTiers).reduce((sum, [t, n]) => sum + (order[t] ?? 0) * n, 0);
}

function suggestSkillForPathClass(pathClass) {
  const map = {
    compliance_pay_time: "hr-regulated-domain",
    product_runtime_mcp: "hr-product-mcp-governance",
    harness_foundation: "hr-foundation-governance",
    ddl_migrations: "hr-data-custody",
    test_stack: "hr-quality-lab",
  };
  return map[pathClass] ?? "hr-orchestration-lanes";
}

function generateL1Stub(cluster) {
  const skill = suggestSkillForPathClass(cluster.pathClass);
  const signalId = cluster.signalIds[0];
  return {
    signal_id: signalId,
    promotionTier: "L1",
    skill,
    markdown: `# Learning signal ${signalId.slice(0, 8)}

**Path class:** ${cluster.pathClass}
**Kind:** ${cluster.kind}
**Count:** ${cluster.count}

## Observed pattern

Repeated ${cluster.kind} on ${cluster.pathClass} paths. Review lane order and skill routing before builder delegation.

## Recommended action

- Load \`@${skill}\` when path trigger \`${cluster.pathClass}\` matches.
- Verify counsel/sentinel lanes for T3+ before builder Task.

## PO gate

PO gate complete: Y (required for L1 promotion)
`,
  };
}

function generateL2Stub(cluster) {
  const signalId = cluster.signalIds[0];
  const skill = suggestSkillForPathClass(cluster.pathClass);
  const pathPattern =
    cluster.pathClass === "harness_foundation"
      ? ".cursor/**"
      : cluster.pathClass === "compliance_pay_time"
        ? "packages/payroll-calc/**"
        : "**/*";

  return {
    signal_id: signalId,
    promotionTier: "L2",
    yaml: {
      adaptation: {
        enabled: true,
        skillRouterHints: [
          {
            id: `${cluster.pathClass}-composition-${signalId.slice(0, 8)}`,
            pathPattern,
            prefer: [skill, "hr-quality-lab"].filter((v, i, a) => a.indexOf(v) === i),
            deprioritize: [],
            minTier: "T3",
            sourceSignalIds: cluster.signalIds.slice(0, 5),
            status: "shadow",
          },
        ],
      },
    },
  };
}

function writeStub(stub, format) {
  const stubsDir = join(learningRoot(), "stubs");
  mkdirSync(stubsDir, { recursive: true });
  const id = stub.signal_id;
  if (format === "L1") {
    const path = join(stubsDir, `${id}-L1.md`);
    writeFileSync(path, stub.markdown);
    return path;
  }
  const path = join(stubsDir, `${id}-L2.yaml`);
  writeFileSync(path, stringifyYaml(stub.yaml));
  return path;
}

function globJson(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .map((n) => join(dir, n));
}

function globYaml(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(".yaml") || n.endsWith(".yml"))
    .map((n) => join(dir, n));
}

function cmdValidate(args) {
  let exit = 0;

  const signalFiles = args.file
    ? [args.file]
    : [join(learningRoot(), "fixtures", "valid-signal.json"), ...globJson(join(learningRoot(), "promoted"))];

  for (const fp of signalFiles) {
    if (!existsSync(fp)) continue;
    const data = JSON.parse(readFileSync(fp, "utf8"));
    if (data.promotedAt && data.tier && data.principal) {
      const okPromoted =
        typeof data.signal_id === "string" &&
        typeof data.stub === "string" &&
        typeof data.artifact === "string";
      if (okPromoted) console.log(`OK: ${fp}`);
      else {
        console.error(`FAIL: ${fp}: invalid promoted record (signal_id, stub, artifact required)`);
        exit = 1;
      }
      continue;
    }
    const target = data.signal ?? data;
    const { ok, issues } = validateSignal(target);
    if (ok) console.log(`OK: ${fp}`);
    else {
      console.error(`FAIL: ${fp}: ${issues.join("; ")}`);
      exit = 1;
    }
  }

  const controlPlanFiles = args.file
    ? args.file.endsWith(".yaml")
      ? [args.file]
      : []
    : [
        join(learningRoot(), "fixtures", "valid-control-plan.yaml"),
        ...globYaml(join(learningRoot(), "control-plans")),
      ];

  for (const fp of controlPlanFiles) {
    if (!existsSync(fp)) continue;
    const doc = parseYaml(readFileSync(fp, "utf8"));
    const { ok, issues } = validateControlPlan(doc);
    if (ok) console.log(`OK: ${fp}`);
    else {
      console.error(`FAIL: ${fp}: ${issues.join("; ")}`);
      exit = 1;
    }
  }

  const routerCheck = checkRouterHintsEnforce();
  if (!routerCheck.ok) {
    for (const w of routerCheck.warnings) console.error(`FAIL: ${w}`);
    exit = 1;
  } else if (routerCheck.warnings.length) {
    for (const w of routerCheck.warnings) console.warn(`WARN: ${w}`);
  }

  return exit;
}

function cmdReflect(args) {
  const signals = readSignals({ importPaths: args.importPaths });
  const openSignals = signals.filter((s) => s.status === "open");
  const clusters = aggregateByPathClass(openSignals);

  const ranked = clusters
    .map((c) => ({ ...c, score: c.count + tierSeverityScore(c.riskTiers) * 0.5 }))
    .sort((a, b) => b.score - a.score);

  const report = {
    generatedAt: new Date().toISOString(),
    totalSignals: signals.length,
    openSignals: openSignals.length,
    clusters: ranked,
    stubs: [],
    ctqSnapshot: computeCtqSnapshot(signals),
  };

  const top = ranked.filter((c) => c.count >= 1).slice(0, 5);
  for (const cluster of top) {
    if (cluster.count >= 2 || tierSeverityScore(cluster.riskTiers) >= 4) {
      const l1 = generateL1Stub(cluster);
      const l1Path = writeStub(l1, "L1");
      report.stubs.push({
        tier: "L1",
        path: l1Path.replace(repoRoot() + "/", ""),
        signal_id: l1.signal_id,
      });

      if (
        ["composition_miss", "tier_mismatch", "lane_gap"].includes(cluster.kind) &&
        tierSeverityScore(cluster.riskTiers) >= 3
      ) {
        const l2 = generateL2Stub(cluster);
        const l2Path = writeStub(l2, "L2");
        report.stubs.push({
          tier: "L2",
          path: l2Path.replace(repoRoot() + "/", ""),
          signal_id: l2.signal_id,
        });
      }
    }
  }

  const reportsDir = join(learningRoot(), "reports");
  mkdirSync(reportsDir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const reportPath = join(reportsDir, `${date}-reflect.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Reflect report: ${reportPath.replace(repoRoot() + "/", "")}`);
  console.log(`Signals: ${signals.length} total, ${openSignals.length} open`);

  for (const cluster of top.slice(0, 5)) {
    console.log(`  - ${cluster.pathClass}/${cluster.kind}: count=${cluster.count}`);
  }

  if (args.dryRun) {
    const stale = findStaleL2Stubs(30);
    if (stale.length) {
      console.warn(`WARN: ${stale.length} L2 stub(s) older than 30d`);
    }
    const missMetric = computeCtqMetric("composition_miss_rate", signals, { windowDays: 14 });
    if (missMetric?.target) {
      const targetNum = parseFloat(String(missMetric.target).replace(/[^0-9.]/g, ""));
      if (!Number.isNaN(targetNum) && missMetric.rate > targetNum) {
        console.warn(
          `WARN: composition_miss_rate ${missMetric.rate} exceeds CTQ target ${missMetric.target} (SPC-lite)`,
        );
      }
    }
  }

  return 0;
}

function findStaleL2Stubs(days) {
  const stubsDir = join(learningRoot(), "stubs");
  if (!existsSync(stubsDir)) return [];
  const cutoff = Date.now() - days * 86400000;
  return readdirSync(stubsDir)
    .filter((n) => n.endsWith("-L2.yaml"))
    .map((n) => join(stubsDir, n))
    .filter((fp) => statSync(fp).mtimeMs < cutoff);
}

function validateControlPlan(doc) {
  const issues = [];
  if (!doc.signal_id || !UUID_RE.test(doc.signal_id)) issues.push("signal_id UUID required");
  if (!doc.principal?.trim()) issues.push("principal required");
  if (!doc.metric?.name) issues.push("metric.name required");
  if (!doc.metric?.signalKind || !SIGNAL_KINDS.includes(doc.metric.signalKind)) {
    issues.push("metric.signalKind must be valid signal kind");
  }
  if (!doc.monitoring?.reviewCadence) issues.push("monitoring.reviewCadence required");
  if (!doc.reactionPlan?.ifPage) issues.push("reactionPlan.ifPage required");
  if (!doc.ownership?.processOwner?.trim()) issues.push("ownership.processOwner required");
  return { ok: issues.length === 0, issues };
}

function loadCtqTree(name = "harness") {
  const file =
    name === "product"
      ? join(learningRoot(), "ctqs", "product-value-ctq-tree.yaml")
      : join(learningRoot(), "ctqs", "harness-ctq-tree.yaml");
  if (!existsSync(file)) return null;
  return parseYaml(readFileSync(file, "utf8"));
}

function resolveCtq(ctqId) {
  for (const treeName of ["harness", "product"]) {
    const tree = loadCtqTree(treeName);
    if (!tree) continue;
    const items = treeName === "product" ? tree.winScorecard ?? [] : tree.littleY ?? [];
    const match = items.find((c) => c.id === ctqId);
    if (match) return { tree: treeName, ctq: match };
  }
  return null;
}

function computeCtqMetric(ctqId, signals, { windowDays = 14 } = {}) {
  const resolved = resolveCtq(ctqId);
  if (!resolved) return null;
  const { ctq } = resolved;
  const cutoff = Date.now() - windowDays * 86400000;
  const filtered = signals.filter((s) => Date.parse(s.ts) >= cutoff);
  const kinds = ctq.signalKinds ?? [];
  const matching = kinds.length
    ? filtered.filter((s) => kinds.includes(s.kind))
    : filtered;
  const total = filtered.length || 1;
  const rate = matching.length / total;
  return {
    ctqId,
    tree: resolved.tree,
    windowDays,
    signalCount: matching.length,
    totalSignals: filtered.length,
    rate: Math.round(rate * 1000) / 1000,
    target: ctq.target ?? null,
    status: ctq.status ?? null,
  };
}

function computeCtqSnapshot(signals, { windowDays = 14 } = {}) {
  const harness = loadCtqTree("harness");
  const product = loadCtqTree("product");
  const snapshot = { generatedAt: new Date().toISOString(), windowDays, harness: [], product: [] };
  for (const ctq of harness?.littleY ?? []) {
    snapshot.harness.push(computeCtqMetric(ctq.id, signals, { windowDays }));
  }
  for (const ctq of product?.winScorecard ?? []) {
    snapshot.product.push({
      ctqId: ctq.id,
      claim: ctq.claim,
      status: ctq.status,
      evidencePaths: ctq.evidencePaths ?? [],
      target: ctq.target,
    });
  }
  return snapshot;
}

function checkRouterHintsEnforce() {
  if (!shouldRouterHintsEnforce()) return { ok: true, warnings: [] };
  const overlayPath = join(repoRoot(), ".cursor", "governance-overlay.yaml");
  if (!existsSync(overlayPath)) return { ok: true, warnings: [] };
  const doc = parseYaml(readFileSync(overlayPath, "utf8"));
  const hints = doc.adaptation?.skillRouterHints ?? [];
  const shadow = hints.filter((h) => h.status === "shadow");
  if (shadow.length) {
    return {
      ok: false,
      warnings: shadow.map((h) => `router hint "${h.id}" still shadow after enforce date`),
    };
  }
  return { ok: true, warnings: [] };
}

function mergeOverlayPathTriggers(triggers) {
  const overlayPath = join(repoRoot(), ".cursor", "governance-overlay.yaml");
  const doc = existsSync(overlayPath)
    ? parseYaml(readFileSync(overlayPath, "utf8"))
    : { extends: "~/.cursor/governance/governance-manifest.yaml" };
  const existing = doc.additionalPathTriggers ?? [];
  const byId = new Map(existing.map((t) => [t.id, t]));
  for (const trigger of triggers) byId.set(trigger.id, trigger);
  doc.additionalPathTriggers = [...byId.values()];
  return { doc, overlayPath };
}

function computeBaselineMetrics(signals, { kind, pathClass, windowDays = 14 }) {
  const cutoff = Date.now() - windowDays * 86400000;
  const filtered = signals.filter((s) => {
    if (Date.parse(s.ts) < cutoff) return false;
    if (kind && s.kind !== kind) return false;
    if (pathClass && s.pathClass !== pathClass) return false;
    return true;
  });
  const byKind = {};
  for (const s of filtered) {
    byKind[s.kind] = (byKind[s.kind] ?? 0) + 1;
  }
  return {
    windowDays,
    totalSignals: filtered.length,
    byKind,
    from: new Date(cutoff).toISOString(),
    to: new Date().toISOString(),
  };
}

function cmdImproveDefine(args) {
  if (!args.project || !args.principal) {
    console.error("improve define requires --project and --principal");
    return 1;
  }
  if (!args.ctq && !args.brief) {
    console.error("improve define requires --ctq or --brief (feature brief / win scorecard link)");
    return 1;
  }
  const templatePath = join(learningRoot(), "templates", "improvement-project-charter.md");
  if (!existsSync(templatePath)) {
    console.error("charter template missing");
    return 1;
  }
  const template = readFileSync(templatePath, "utf8");
  const date = new Date().toISOString().slice(0, 10);
  const body = template
    .replace(/\{\{PROJECT_ID\}\}/g, args.project)
    .replace(/\{\{PRINCIPAL\}\}/g, args.principal)
    .replace(/\{\{DATE\}\}/g, date);
  const projectsDir = join(learningRoot(), "projects");
  mkdirSync(projectsDir, { recursive: true });
  const outPath = join(projectsDir, `${args.project}-charter.md`);
  if (existsSync(outPath) && !args.force) {
    console.error(`charter exists: ${outPath} (use --force)`);
    return 1;
  }
  writeFileSync(outPath, body);
  console.log(`Charter: ${outPath.replace(repoRoot() + "/", "")}`);
  if (args.ctq) {
    const resolved = resolveCtq(args.ctq);
    if (!resolved) {
      console.error(`unknown CTQ: ${args.ctq}`);
      return 1;
    }
    console.log(`Linked CTQ: ${args.ctq} (${resolved.tree} tree)`);
  }
  if (args.brief) console.log(`Linked brief: ${args.brief}`);
  return 0;
}

function cmdImproveMeasure(args) {
  const windowDays = args.days ?? 14;
  const signals = readSignals({ importPaths: args.importPaths });
  const baseline = computeBaselineMetrics(signals, {
    kind: args.kind,
    pathClass: args.pathClass,
    windowDays,
  });
  baseline.project = args.project ?? "ad-hoc";
  baseline.ctqId = args.ctq ?? null;
  baseline.signalFilter = { kind: args.kind ?? null, pathClass: args.pathClass ?? null };

  if (args.ctq) {
    const metric = computeCtqMetric(args.ctq, signals, { windowDays });
    if (metric) {
      baseline.ctqMetric = metric;
      console.log(`CTQ ${args.ctq}: rate=${metric.rate} target=${metric.target ?? "n/a"}`);
    } else {
      console.warn(`WARN: unknown CTQ id ${args.ctq}`);
    }
  }

  const baselinesDir = join(learningRoot(), "baselines");
  mkdirSync(baselinesDir, { recursive: true });
  const id = args.project ?? args.signal ?? `baseline-${Date.now()}`;
  const outPath = join(baselinesDir, `${id}-baseline.json`);
  writeFileSync(outPath, JSON.stringify(baseline, null, 2));
  console.log(`Baseline: ${outPath.replace(repoRoot() + "/", "")}`);
  console.log(`Signals in window: ${baseline.totalSignals}`);
  console.log(JSON.stringify(baseline.byKind, null, 2));
  return 0;
}

function cmdImproveAnalyze(args) {
  if (!args.signal || !args.principal) {
    console.error("improve analyze requires --signal (UUID) and --principal");
    return 1;
  }
  const signals = readSignals({ importPaths: args.importPaths });
  const match = signals.find((s) => s.signal_id === args.signal);
  const templatePath = join(learningRoot(), "templates", "rca-template.md");
  const template = readFileSync(templatePath, "utf8");
  const date = new Date().toISOString().slice(0, 10);
  const body = template
    .replace(/\{\{SIGNAL_ID\}\}/g, args.signal)
    .replace(/\{\{KIND\}\}/g, match?.kind ?? "unknown")
    .replace(/\{\{PATH_CLASS\}\}/g, match?.pathClass ?? "unknown")
    .replace(/\{\{PROJECT_ID\}\}/g, args.project ?? "ad-hoc")
    .replace(/\{\{PRINCIPAL\}\}/g, args.principal)
    .replace(/\{\{DATE\}\}/g, date);
  const rcaDir = join(learningRoot(), "rca");
  mkdirSync(rcaDir, { recursive: true });
  const outPath = join(rcaDir, `${args.signal}-rca.md`);
  writeFileSync(outPath, body);
  console.log(`RCA stub: ${outPath.replace(repoRoot() + "/", "")}`);
  if (match?.hypothesis) console.log(`Hypothesis: ${match.hypothesis}`);
  return 0;
}

function cmdImproveControl(args) {
  if (!args.signal || !args.principal) {
    console.error("improve control requires --signal and --principal");
    return 1;
  }
  const controlDir = join(learningRoot(), "control-plans");
  mkdirSync(controlDir, { recursive: true });
  const outPath = join(controlDir, `${args.signal}-control.yaml`);

  if (args.plan) {
    const src = join(repoRoot(), args.plan);
    if (!existsSync(src)) {
      console.error(`control plan not found: ${src}`);
      return 1;
    }
    const doc = parseYaml(readFileSync(src, "utf8"));
    if (!doc.signal_id) doc.signal_id = args.signal;
    if (!doc.principal) doc.principal = args.principal;
    const { ok, issues } = validateControlPlan(doc);
    if (!ok) {
      console.error(`Invalid control plan: ${issues.join("; ")}`);
      return 1;
    }
    writeFileSync(outPath, stringifyYaml(doc));
    console.log(`Control plan validated: ${outPath.replace(repoRoot() + "/", "")}`);
    return 0;
  }

  const templatePath = join(learningRoot(), "templates", "control-plan.yaml");
  const template = readFileSync(templatePath, "utf8");
  const doc = parseYaml(template);
  doc.signal_id = args.signal;
  doc.principal = args.principal;
  if (args.ctq) doc.ctqId = args.ctq;
  writeFileSync(outPath, stringifyYaml(doc));
  console.log(`Control plan stub: ${outPath.replace(repoRoot() + "/", "")}`);
  console.log("Fill metric targets and ownership, then re-run with --plan");
  return 0;
}

function cmdImprove(args) {
  const phase = args.improvePhase ?? "define";
  if (phase === "define") return cmdImproveDefine(args);
  if (phase === "measure") return cmdImproveMeasure(args);
  if (phase === "analyze") return cmdImproveAnalyze(args);
  if (phase === "control") return cmdImproveControl(args);
  console.error(`Unknown improve phase: ${phase}`);
  return 1;
}

function requireControlPlanForL2(signalId, controlPlanArg, dryRun) {
  if (dryRun) return { ok: true };
  const planPath = controlPlanArg
    ? join(repoRoot(), controlPlanArg)
    : join(learningRoot(), "control-plans", `${signalId}-control.yaml`);
  if (!existsSync(planPath)) {
    return {
      ok: false,
      message: `L2 promote requires control plan at ${planPath.replace(repoRoot() + "/", "")} or --control-plan`,
    };
  }
  const doc = parseYaml(readFileSync(planPath, "utf8"));
  if (doc.signal_id && doc.signal_id !== signalId) {
    return { ok: false, message: "control plan signal_id mismatch" };
  }
  const { ok, issues } = validateControlPlan({ ...doc, signal_id: signalId });
  if (!ok) return { ok: false, message: `control plan invalid: ${issues.join("; ")}` };
  return { ok: true, path: planPath };
}

function touchesNonLearnable(content) {
  return NON_LEARNABLE_PATHS.some((p) => content.includes(p));
}

function mergeOverlayAdaptation(fragment) {
  const overlayPath = join(repoRoot(), ".cursor", "governance-overlay.yaml");
  const doc = existsSync(overlayPath)
    ? parseYaml(readFileSync(overlayPath, "utf8"))
    : { extends: "~/.cursor/governance/governance-manifest.yaml" };

  doc.adaptation = doc.adaptation ?? { enabled: true, skillRouterHints: [] };
  doc.adaptation.enabled = true;

  const incoming = fragment.adaptation?.skillRouterHints ?? [];
  const existing = doc.adaptation.skillRouterHints ?? [];
  const byId = new Map(existing.map((h) => [h.id, h]));
  for (const hint of incoming) byId.set(hint.id, hint);
  doc.adaptation.skillRouterHints = [...byId.values()];

  return { doc, overlayPath };
}

function writePromotedRecord({ signal_id, tier, principal, stub, artifact, controlPlan, adrPath, dryRun }) {
  if (dryRun) return;
  const promotedDir = join(learningRoot(), "promoted");
  mkdirSync(promotedDir, { recursive: true });
  const record = {
    signal_id,
    promotedAt: new Date().toISOString(),
    tier,
    principal,
    stub,
    artifact,
  };
  if (controlPlan) record.controlPlan = controlPlan;
  if (adrPath) record.adrPath = adrPath;
  writeFileSync(join(promotedDir, `${signal_id}.json`), JSON.stringify(record, null, 2));
}

function cmdPromote(args) {
  if (!args.stub || !args.principal) {
    console.error("promote requires --stub and --principal");
    return 1;
  }
  if (!args.tier || !["L1", "L2", "L3"].includes(args.tier)) {
    console.error("promote requires --tier L1, L2, or L3");
    return 1;
  }

  const stubPath = join(repoRoot(), args.stub);
  if (!existsSync(stubPath)) {
    console.error(`stub not found: ${stubPath}`);
    return 1;
  }

  const content = readFileSync(stubPath, "utf8");
  if (touchesNonLearnable(content)) {
    console.error("ERROR: stub touches non-learnable invariant paths");
    return 1;
  }

  if (args.tier === "L1") {
    if (!args.skill) {
      console.error("L1 promote requires --skill");
      return 1;
    }
    if (!/PO gate complete:\s*Y/i.test(content)) {
      console.error("L1 stub must include 'PO gate complete: Y'");
      return 1;
    }

    const signalIdMatch = stubPath.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    );
    const signalId = signalIdMatch?.[1] ?? randomUUID();
    const outDir = join(repoRoot(), ".cursor", "skills", args.skill, "references", "learning");
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, `${signalId}.md`);

    if (args.dryRun) {
      console.log(`[dry-run] would write ${outPath}`);
    } else {
      writeFileSync(outPath, content);
      try {
        execSync("npm run governance:ci", { cwd: repoRoot(), stdio: "pipe" });
      } catch {
        console.error("ERROR: governance:ci failed");
        return 1;
      }
    }

    writePromotedRecord({
      signal_id: signalId,
      tier: "L1",
      principal: args.principal,
      stub: args.stub,
      artifact: outPath.replace(repoRoot() + "/", ""),
      dryRun: args.dryRun,
    });
  }

  if (args.tier === "L2") {
    const fragment = parseYaml(content);
    if (!fragment.adaptation) {
      console.error("L2 stub must contain adaptation YAML");
      return 1;
    }

    const { doc, overlayPath } = mergeOverlayAdaptation(fragment);

    if (args.dryRun) {
      console.log(`[dry-run] would update ${overlayPath}`);
      console.log(stringifyYaml({ adaptation: doc.adaptation }));
    } else {
      const fullDoc = readFileSync(overlayPath, "utf8");
      const adaptationYaml = stringifyYaml({ adaptation: doc.adaptation }).trimEnd();
      if (fullDoc.includes("\nadaptation:")) {
        writeFileSync(
          overlayPath,
          fullDoc.replace(/\nadaptation:[\s\S]*$/m, "\n" + adaptationYaml + "\n"),
        );
      } else {
        writeFileSync(overlayPath, fullDoc.trimEnd() + "\n\n" + adaptationYaml + "\n");
      }
    }

    const signalId =
      fragment.adaptation.skillRouterHints?.[0]?.sourceSignalIds?.[0] ?? randomUUID();

    const controlCheck = requireControlPlanForL2(signalId, args.controlPlan, args.dryRun);
    if (!controlCheck.ok) {
      console.error(`ERROR: ${controlCheck.message}`);
      return 1;
    }

    if (fragment.enforcementProfile?.profile) {
      if (args.dryRun) {
        console.log(
          `[dry-run] would write enforcement-profile.json → ${fragment.enforcementProfile.profile}`,
        );
      } else {
        writeEnforcementProfileFile(fragment.enforcementProfile.profile, {
          source: "L2-promote",
          reason: fragment.enforcementProfile.reason ?? "L2 stub",
          principal: args.principal,
        });
        console.log(
          `Wrote .cursor/hooks-output/enforcement-profile.json (${fragment.enforcementProfile.profile})`,
        );
      }
    }

    writePromotedRecord({
      signal_id: signalId,
      tier: "L2",
      principal: args.principal,
      stub: args.stub,
      artifact: ".cursor/governance-overlay.yaml",
      controlPlan: controlCheck.path?.replace(repoRoot() + "/", ""),
      dryRun: args.dryRun,
    });
  }

  if (args.tier === "L3") {
    if (!args.adr) {
      console.error("L3 promote requires --adr path to specs/alignment/decisions/*.md");
      return 1;
    }
    const adrPath = join(repoRoot(), args.adr);
    if (!existsSync(adrPath) || !args.adr.includes("specs/alignment/decisions/")) {
      console.error("L3 --adr must exist under specs/alignment/decisions/");
      return 1;
    }

    const fragment = parseYaml(content);
    if (!fragment.additionalPathTriggers?.length) {
      console.error("L3 stub must contain additionalPathTriggers YAML array");
      return 1;
    }
    if (!/counselReview:\s*approved/i.test(content)) {
      console.error("L3 stub must include counselReview: approved");
      return 1;
    }

    const { doc, overlayPath } = mergeOverlayPathTriggers(fragment.additionalPathTriggers);

    if (args.dryRun) {
      console.log(`[dry-run] would update ${overlayPath} path triggers`);
      console.log(stringifyYaml({ additionalPathTriggers: doc.additionalPathTriggers }));
    } else {
      const fullDoc = readFileSync(overlayPath, "utf8");
      const triggersYaml = stringifyYaml({ additionalPathTriggers: doc.additionalPathTriggers }).trimEnd();
      if (fullDoc.includes("\nadditionalPathTriggers:")) {
        writeFileSync(
          overlayPath,
          fullDoc.replace(/\nadditionalPathTriggers:[\s\S]*?(?=\n[a-zA-Z]|$)/m, "\n" + triggersYaml + "\n"),
        );
      } else {
        writeFileSync(overlayPath, fullDoc.trimEnd() + "\n\n" + triggersYaml + "\n");
      }
      try {
        execSync("npm run governance:sync-check:strict", { cwd: repoRoot(), stdio: "pipe" });
      } catch {
        console.error("ERROR: governance:sync-check:strict failed");
        return 1;
      }
    }

    const signalIdMatch = stubPath.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    );
    const signalId = signalIdMatch?.[1] ?? randomUUID();

    writePromotedRecord({
      signal_id: signalId,
      tier: "L3",
      principal: args.principal,
      stub: args.stub,
      artifact: ".cursor/governance-overlay.yaml",
      adrPath: args.adr,
      dryRun: args.dryRun,
    });
  }

  console.log(`Promoted ${args.tier} from ${args.stub}`);
  return 0;
}

export function emitEvidenceSignal(partial) {
  if (!shouldEmitLearning()) return null;
  return appendSignal(
    {
      ...partial,
      source: partial.source ?? { plane: "evidence", artifact: "governance-lint" },
    },
    { warnOnly: true },
  );
}

export function loadAdaptation(manifest) {
  return manifest.adaptation ?? { enabled: false, skillRouterHints: [] };
}

export function matchRouterHints(files, adaptation, tier) {
  if (!adaptation?.enabled || !adaptation.skillRouterHints?.length) return [];
  return adaptation.skillRouterHints.filter((hint) => {
    if (hint.minTier && !tierAtLeast(tier, hint.minTier)) return false;
    return files.some((f) => matchPath(f, hint.pathPattern));
  });
}

function parseArgs(argv) {
  const args = {
    command: "validate",
    improvePhase: null,
    dryRun: false,
    force: false,
    file: null,
    stub: null,
    tier: null,
    skill: null,
    principal: null,
    project: null,
    signal: null,
    ctq: null,
    kind: null,
    pathClass: null,
    days: null,
    controlPlan: null,
    plan: null,
    adr: null,
    brief: null,
    importPaths: [],
  };
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--force") args.force = true;
    else if (a === "--file") args.file = argv[++i];
    else if (a === "--stub") args.stub = argv[++i];
    else if (a === "--tier") args.tier = argv[++i];
    else if (a === "--skill") args.skill = argv[++i];
    else if (a === "--principal") args.principal = argv[++i];
    else if (a === "--project") args.project = argv[++i];
    else if (a === "--signal") args.signal = argv[++i];
    else if (a === "--ctq") args.ctq = argv[++i];
    else if (a === "--kind") args.kind = argv[++i];
    else if (a === "--path-class") args.pathClass = argv[++i];
    else if (a === "--days") args.days = Number(argv[++i]);
    else if (a === "--control-plan") args.controlPlan = argv[++i];
    else if (a === "--plan") args.plan = argv[++i];
    else if (a === "--adr") args.adr = argv[++i];
    else if (a === "--brief") args.brief = argv[++i];
    else if (a === "--import") args.importPaths.push(argv[++i]);
    else positional.push(a);
  }
  if (positional[0]) args.command = positional[0];
  if (args.command === "improve" && positional[1]) args.improvePhase = positional[1];
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.command === "validate") return cmdValidate(args);
  if (args.command === "reflect") return cmdReflect(args);
  if (args.command === "promote") return cmdPromote(args);
  if (args.command === "improve") return cmdImprove(args);
  console.error(`Unknown command: ${args.command}`);
  return 1;
}

const isMain = process.argv[1]?.includes("governance-learning");
if (isMain) process.exit(await main());
