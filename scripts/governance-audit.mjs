#!/usr/bin/env node
/**
 * governance-audit — Runtime harness health check (ADR 0016 / ALARP)
 *
 * Reads IDE hook outputs (audit.log, lane state, gap report) and optional
 * adaptation reflect data. Fails when orchestration hooks are inert or T3+
 * sessions end with critical lane gaps.
 *
 * CTQ mapping (behaviorScore / recommendedProfile):
 * - counsel_before_builder_rate → pretooluse_never_fired, t3_critical_lanes_incomplete, counsel in session.completed
 * - handoff_discover_pass_rate → handoff_discover_failed
 * - composition_miss_rate → lane_authority_strict, subagent_hooks_inert
 *
 * Usage:
 *   node governance-audit.mjs [--json] [--strict] [--write-report]
 *   node governance-audit.mjs --lines 800 --require-audit-log
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { resolveHookMode, rolloutDateReached, loadHookModeConfig } from "../.cursor/hooks/lib.mjs";
import { loadLaneState, laneGaps, criticalLanesForTier, tierAtLeast } from "../.cursor/hooks/lane-state.mjs";
import { appendSignal } from "./governance-learning.mjs";
import {
  computeBehaviorScore,
  recommendProfile,
  resolveActiveProfileForAudit,
  maybeAutoDemote,
  loadGraduationConfig,
} from "./governance-enforcement-profile.mjs";

const FEATURE_AUDIT_DIR = join("specs", "features", "agent-governance-alarp");
const DEFAULT_REPORT_JSON = join(FEATURE_AUDIT_DIR, "audit-latest.json");

function parseArgs(argv) {
  const args = {
    json: false,
    strict: false,
    writeReport: false,
    lines: 500,
    requireAuditLog: false,
    quiet: false,
    emitSignals: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") args.json = true;
    else if (a === "--strict") args.strict = true;
    else if (a === "--write-report") args.writeReport = true;
    else if (a === "--quiet") args.quiet = true;
    else if (a === "--require-audit-log") args.requireAuditLog = true;
    else if (a === "--emit-signals") args.emitSignals = true;
    else if (a === "--lines") args.lines = Number(argv[++i]) || 500;
    else if (a === "--help" || a === "-h") {
      console.log(`Usage: node governance-audit.mjs [options]

Options:
  --json                 Machine-readable report on stdout
  --strict               Treat warnings as failures (exit 2)
  --write-report         Write ${DEFAULT_REPORT_JSON}
  --lines N              Tail N lines of audit.log (default 500)
  --require-audit-log    Fail if .cursor/hooks-output/audit.log is missing
  --emit-signals         Append composition_miss signals for critical findings
  --quiet                Only print summary / JSON
`);
      process.exit(0);
    }
  }
  if (process.env.GOVERNANCE_AUDIT_REQUIRE_LOG === "1") {
    args.requireAuditLog = true;
  }
  return args;
}

function repoRoot() {
  return process.cwd();
}

function hooksOutputPath(name) {
  return join(repoRoot(), ".cursor", "hooks-output", name);
}

function readJsonFile(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function tailLines(path, maxLines) {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf8").trim();
  if (!raw) return [];
  return raw.split("\n").slice(-maxLines);
}

function parseAuditEvents(lines) {
  const events = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line));
    } catch {
      /* skip malformed */
    }
  }
  return events;
}

function countByEvent(events) {
  const counts = {};
  for (const e of events) {
    const key = e.event ?? "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function latestReflectReport() {
  const dir = join(repoRoot(), "specs", "governance", "learning", "reports");
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => f.endsWith("-reflect.json"))
    .map((f) => {
      const p = join(dir, f);
      return { path: p, mtime: statSync(p).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  if (!files.length) return null;
  return readJsonFile(files[0].path);
}

function rolloutStatus() {
  const cfg = loadHookModeConfig();
  const keys = [
    "laneStateShadowUntil",
    "handoffDiscoverStrictFrom",
    "collaborationGateEnforceFrom",
    "preToolUseDenyT3From",
    "routerHintsEnforceFrom",
  ];
  const rollout = {};
  for (const key of keys) {
    rollout[key] = {
      scheduled: cfg?.v4Rollout?.[key] ?? null,
      active: rolloutDateReached(key),
    };
  }
  return rollout;
}

function diffHandoffDiscover() {
  try {
    execSync("node scripts/governance-lint.mjs handoff --discover --strict", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { ok: true, issues: [] };
  } catch (err) {
    const stderr = err.stderr?.toString?.() ?? err.message ?? String(err);
    const stdout = err.stdout?.toString?.() ?? "";
    const text = `${stdout}\n${stderr}`.trim();
    return { ok: false, issues: text.split("\n").filter(Boolean).slice(0, 20) };
  }
}

function buildFindings(ctx) {
  const findings = [];
  const { counts, state, gapReport, reflect, rollout, handoffDiscover } = ctx;

  if (ctx.requireAuditLog && !ctx.auditLogPresent) {
    findings.push({
      id: "audit_log_missing",
      severity: "critical",
      message: "audit.log missing; run IDE sessions with hooks enabled or drop --require-audit-log",
    });
    return findings;
  }

  if (!ctx.auditLogPresent) {
    findings.push({
      id: "audit_log_absent",
      severity: "info",
      message: "No local audit.log — orchestration checks skipped (expected in CI without IDE)",
    });
    return findings;
  }

  const stopCount = counts.stop ?? 0;
  const subagentStart = counts.subagentStart ?? 0;
  const subagentStop = counts.subagentStop ?? 0;
  const preToolUse = counts.preToolUse ?? 0;
  const shellCount = counts.beforeShellExecution ?? 0;
  const editCount = counts.afterFileEdit ?? 0;

  if (preToolUse === 0 && (subagentStart > 0 || stopCount >= 5)) {
    findings.push({
      id: "pretooluse_never_fired",
      severity: "critical",
      message:
        "preToolUse has 0 events in the audit window — counsel-before-builder Task gate is inert",
      detail: { stopCount, subagentStart, windowLines: ctx.lines },
    });
  }

  if (subagentStart === 0 && stopCount >= 10 && editCount >= 20) {
    findings.push({
      id: "subagent_hooks_inert",
      severity: "critical",
      message:
        "subagentStart never fired despite active edit/stop traffic — lane state will stay empty",
      detail: { stopCount, editCount, shellCount },
    });
  }

  if (subagentStart > 0 && subagentStop < Math.max(1, Math.floor(subagentStart / 2))) {
    findings.push({
      id: "subagent_stop_sparse",
      severity: "warn",
      message: "subagentStop count is low vs subagentStart — lane completion may be under-recorded",
      detail: { subagentStart, subagentStop },
    });
  }

  const tier = state?.riskTier ?? gapReport?.tier ?? "T1";
  if (tierAtLeast(tier, "T3")) {
    const critical = criticalLanesForTier(tier);
    const completed = new Set((state?.completed ?? []).map((c) => c.function));
    const missingCritical = critical.filter((l) => !completed.has(l));
    if (missingCritical.length) {
      findings.push({
        id: "t3_critical_lanes_incomplete",
        severity: "warn",
        message: `Session tier ${tier} missing critical lanes in lane state: ${missingCritical.join(", ")}`,
        detail: { missingCritical, completed: [...completed] },
      });
    }

    if (gapReport?.missingLanes?.length) {
      const gapCritical = gapReport.missingLanes.filter((l) => critical.includes(l));
      if (gapCritical.length) {
        findings.push({
          id: "t3_gap_report_critical",
          severity: "warn",
          message: `Last stop gap report lists critical lanes missing: ${gapCritical.join(", ")}`,
          detail: { missingLanes: gapReport.missingLanes, at: gapReport.at },
        });
      }
    }

    if (!rollout.preToolUseDenyT3From?.active) {
      findings.push({
        id: "counsel_deny_scheduled",
        severity: "info",
        message: `preToolUseDenyT3From not active until ${rollout.preToolUseDenyT3From?.scheduled ?? "?"}`,
      });
    } else if (preToolUse === 0) {
      findings.push({
        id: "counsel_deny_active_but_inert",
        severity: "critical",
        message: "preToolUseDenyT3From is active but preToolUse never fired — deny path unreachable",
      });
    }

    if (state && !state.revalidationConfirmed) {
      findings.push({
        id: "collaboration_revalidation_open",
        severity: "warn",
        message: "T3+ session without revalidationConfirmed — specialized delegation should be gated",
        detail: { phase: state.collaborationPhase },
      });
    }
  }

  const { missing } = laneGaps(state ?? { plannedLanes: [], completed: [] });
  if (missing.length >= 4 && stopCount >= 3) {
    findings.push({
      id: "broad_lane_gaps",
      severity: "warn",
      message: `Planned lanes largely incomplete (${missing.length}): ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? "…" : ""}`,
    });
  }

  if (reflect?.openSignals >= 50) {
    findings.push({
      id: "adaptation_backlog_high",
      severity: "warn",
      message: `Learning ledger has ${reflect.openSignals} open signals — review reflect report`,
      detail: { totalSignals: reflect.totalSignals, topCluster: reflect.clusters?.[0] },
    });
  }

  if ((state?.poInjectCount ?? 0) > 60) {
    findings.push({
      id: "po_inject_fatigue",
      severity: "warn",
      message: `poInjectCount=${state.poInjectCount} — consider filling brief/handoff; inject uses compact/skip between reminders`,
      detail: { poInjectCount: state.poInjectCount },
    });
  }

  if (rolloutDateReached("laneStateShadowUntil") && state) {
    const req = state.governanceCache?.planSummary?.requiredLanes ?? [];
    const { missing: laneMissing } = laneGaps(state);
    const reqMissing = laneMissing.filter((l) => req.includes(l));
    if (reqMissing.length) {
      findings.push({
        id: "lane_authority_strict",
        severity: "critical",
        message: `Required lanes incomplete in session state: ${reqMissing.join(", ")}`,
        detail: { reqMissing, planned: state.plannedLanes },
      });
    }
  }

  if (!handoffDiscover.ok) {
    findings.push({
      id: "handoff_discover_failed",
      severity: ctx.strict ? "critical" : "warn",
      message: "governance-lint handoff --discover --strict failed for current diff",
      detail: { issues: handoffDiscover.issues },
    });
  }

  const stopBlocked = ctx.stopBlockedCount ?? 0;
  if (stopBlocked >= 3) {
    findings.push({
      id: "stop_advisory_only",
      severity: "info",
      message: `${stopBlocked} stop events logged blocked:true but sessions still completed (advisory stop hook)`,
    });
  }

  return findings;
}

function grade(findings) {
  const critical = findings.filter((f) => f.severity === "critical").length;
  const warn = findings.filter((f) => f.severity === "warn").length;
  if (critical > 0) return "F";
  if (warn >= 3) return "D";
  if (warn > 0) return "C";
  return "B+";
}

function printHuman(report) {
  const { summary, findings, eventCounts: counts, hookMode, rollout } = report;
  console.log("Governance runtime audit");
  console.log(`  Hook mode: ${hookMode}`);
  console.log(`  Grade: ${summary.grade} (${summary.critical} critical, ${summary.warn} warn)`);
  if (report.enforcement) {
    const e = report.enforcement;
    console.log(
      `  Enforcement: active=${e.activeProfile} recommended=${e.recommendedProfile} score=${e.behaviorScore}`,
    );
    if (e.lastDemote?.demoted) {
      console.log(`  Auto-demote: ${e.lastDemote.reason}`);
    }
  }
  if (report.auditWindow?.lines) {
    console.log(`  Audit window: last ${report.auditWindow.lines} lines`);
  }
  if (Object.keys(counts).length) {
    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    console.log(`  Events: ${top}`);
  }
  console.log("");
  for (const f of findings) {
    const tag = f.severity.toUpperCase().padEnd(8);
    console.log(`  [${tag}] ${f.id}: ${f.message}`);
  }
  if (rollout) {
    console.log("\n  Rollout (active = date reached):");
    for (const [key, val] of Object.entries(rollout)) {
      console.log(`    ${key}: ${val.active ? "active" : "pending"} (${val.scheduled ?? "—"})`);
    }
  }
}

function main() {
  const args = parseArgs(process.argv);
  const auditPath = hooksOutputPath("audit.log");
  const auditLogPresent = existsSync(auditPath);
  const lines = auditLogPresent ? tailLines(auditPath, args.lines) : [];
  const events = parseAuditEvents(lines);
  const counts = countByEvent(events);
  const stopBlockedCount = events.filter(
    (e) => e.event === "stop" && e.blocked === true,
  ).length;

  const state = loadLaneState();
  const gapReport = readJsonFile(hooksOutputPath("lane-gap-report.json"));
  const reflect = latestReflectReport();
  const reflectSummary = reflect
    ? {
        generatedAt: reflect.generatedAt,
        totalSignals: reflect.totalSignals,
        openSignals: reflect.openSignals,
        clusters: (reflect.clusters ?? []).slice(0, 3).map((c) => ({
          pathClass: c.pathClass,
          kind: c.kind,
          count: c.count,
        })),
      }
    : null;

  const handoffDiscover = diffHandoffDiscover();

  const findings = buildFindings({
    counts,
    state,
    gapReport,
    reflect: reflectSummary,
    rollout: rolloutStatus(),
    handoffDiscover,
    auditLogPresent,
    requireAuditLog: args.requireAuditLog,
    lines: args.lines,
    strict: args.strict,
    stopBlockedCount,
  });

  const summary = {
    grade: grade(findings),
    critical: findings.filter((f) => f.severity === "critical").length,
    warn: findings.filter((f) => f.severity === "warn").length,
    info: findings.filter((f) => f.severity === "info").length,
    ok: findings.every((f) => f.severity === "info"),
  };

  const graduation = loadGraduationConfig();
  const behaviorScore = computeBehaviorScore({
    findings,
    counts,
    state,
    handoffDiscoverOk: handoffDiscover.ok,
  });
  const recommendedProfile = recommendProfile({
    behaviorScore,
    findings,
    state,
    graduation,
  });
  const activeResolved = resolveActiveProfileForAudit();
  const stopCount = counts.stop ?? 0;
  const subagentStart = counts.subagentStart ?? 0;
  const enforcement = {
    behaviorScore,
    recommendedProfile,
    activeProfile: activeResolved.profile,
    activeSource: activeResolved.source,
    graduation,
    ctqHints: {
      preToolUseEvents: counts.preToolUse ?? 0,
      subagentStartRate: stopCount > 0 ? Number((subagentStart / stopCount).toFixed(3)) : 0,
      handoffDiscoverOk: handoffDiscover.ok,
    },
  };

  let demoteResult = { demoted: false };
  if (args.writeReport) {
    demoteResult = maybeAutoDemote({
      grade: summary.grade,
      behaviorScore,
      criticalCount: summary.critical,
    });
    if (demoteResult.demoted) {
      enforcement.activeProfile = "balanced";
      enforcement.activeSource = "auto-demote";
      enforcement.lastDemote = demoteResult;
    }
  }

  const report = {
    schema: "governance-audit/v1",
    generatedAt: new Date().toISOString(),
    hookMode: resolveHookMode(),
    auditWindow: auditLogPresent ? { lines: lines.length, tailRequested: args.lines } : null,
    auditLogPresent,
    eventCounts: counts,
    session: state
      ? {
          sessionId: state.sessionId,
          riskTier: state.riskTier,
          pathClass: state.pathClass,
          plannedLanes: state.plannedLanes,
          started: (state.started ?? []).length,
          completed: (state.completed ?? []).map((c) => c.function),
          collaborationPhase: state.collaborationPhase,
          revalidationConfirmed: state.revalidationConfirmed,
          poInjectCount: state.poInjectCount,
        }
      : null,
    gapReport,
    reflect: reflectSummary,
    rollout: rolloutStatus(),
    handoffDiscover: { ok: handoffDiscover.ok },
    findings,
    summary,
    enforcement,
    references: {
      featureAudit: "specs/features/agent-governance-alarp/runtime-audit-2026-06-01.md",
      hookRollout: "docs/meta/hook-rollout-schedule.md",
      adr: "specs/alignment/decisions/0016-agent-harness-foundation.md",
    },
  };

  if (args.writeReport) {
    const outPath = join(repoRoot(), DEFAULT_REPORT_JSON);
    mkdirSync(join(repoRoot(), FEATURE_AUDIT_DIR), { recursive: true });
    writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
    if (!args.quiet && !args.json) {
      console.log(`Wrote ${DEFAULT_REPORT_JSON}`);
    }
  }

  if (args.emitSignals && summary.critical > 0) {
    for (const f of findings.filter((x) => x.severity === "critical")) {
      appendSignal(
        {
          kind: "composition_miss",
          riskTier: state?.riskTier ?? "T1",
          pathClass: state?.pathClass ?? "harness_audit",
          source: { plane: "evidence", artifact: "governance-audit" },
          hypothesis: f.message,
          detail: { findingId: f.id, ...f.detail },
        },
        { warnOnly: true },
      );
    }
  }

  if (args.emitSignals && demoteResult.demoted) {
    appendSignal(
      {
        kind: "enforcement_regression",
        riskTier: state?.riskTier ?? "T1",
        pathClass: "harness_enforcement",
        source: { plane: "evidence", artifact: "governance-audit" },
        hypothesis: `Auto-demoted enforcement profile to balanced: ${demoteResult.reason}`,
        detail: { behaviorScore, grade: summary.grade, ...demoteResult },
      },
      { warnOnly: true },
    );
  }

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else if (!args.quiet) {
    printHuman(report);
  } else {
    console.log(
      `${summary.grade}: ${summary.critical} critical, ${summary.warn} warn, ${summary.info} info`,
    );
  }

  if (summary.critical > 0) process.exit(1);
  if (args.strict && summary.warn > 0) process.exit(2);
  process.exit(0);
}

main();
