/**
 * Read/write enforcement profile for audit graduation (auto-demote only).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { loadHookModeConfig } from "../.cursor/hooks/lib.mjs";
import { VALID_PROFILES, getEnforcementProfile } from "../.cursor/hooks/enforcement-profile.mjs";

export function hooksOutputPath(name) {
  return join(process.cwd(), ".cursor", "hooks-output", name);
}

export function readEnforcementProfileFile() {
  const path = hooksOutputPath("enforcement-profile.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

export function writeEnforcementProfileFile(profile, { source, reason, principal } = {}) {
  if (!VALID_PROFILES.includes(profile)) {
    throw new Error(`Invalid profile: ${profile}`);
  }
  const outDir = hooksOutputPath("");
  mkdirSync(outDir, { recursive: true });
  const record = {
    profile,
    source: source ?? "audit",
    reason: reason ?? "",
    at: new Date().toISOString(),
  };
  if (principal) record.principal = principal;
  writeFileSync(hooksOutputPath("enforcement-profile.json"), JSON.stringify(record, null, 2) + "\n");
  return record;
}

export function readScoreHistory() {
  const path = hooksOutputPath("enforcement-score-history.json");
  if (!existsSync(path)) return { weeks: [] };
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return { weeks: [] };
  }
}

export function appendScoreHistoryWeek({ behaviorScore, grade, weekKey }) {
  const history = readScoreHistory();
  const key = weekKey ?? isoWeekKey(new Date());
  const weeks = (history.weeks ?? []).filter((w) => w.week !== key);
  weeks.push({ week: key, behaviorScore, grade, at: new Date().toISOString() });
  weeks.sort((a, b) => a.week.localeCompare(b.week));
  const trimmed = weeks.slice(-12);
  const out = { weeks: trimmed };
  writeFileSync(hooksOutputPath("enforcement-score-history.json"), JSON.stringify(out, null, 2) + "\n");
  return out;
}

export function isoWeekKey(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function loadGraduationConfig() {
  const cfg = loadHookModeConfig();
  return {
    promoteScoreMin: cfg?.enforcementGraduation?.promoteScoreMin ?? 80,
    demoteScoreMax: cfg?.enforcementGraduation?.demoteScoreMax ?? 50,
    demoteConsecutiveWeeks: cfg?.enforcementGraduation?.demoteConsecutiveWeeks ?? 2,
    autoPromote: cfg?.enforcementGraduation?.autoPromote ?? false,
    autoDemote: cfg?.enforcementGraduation?.autoDemote ?? true,
  };
}

/**
 * CTQ-aligned score (0–100). See governance-audit.mjs header for mapping.
 */
export function computeBehaviorScore({ findings, counts, state, handoffDiscoverOk }) {
  let score = 100;
  const findingIds = new Set(findings.map((f) => f.id));
  const critical = findings.filter((f) => f.severity === "critical");

  score -= Math.min(75, critical.length * 25);
  if (findingIds.has("lane_authority_strict")) score -= 20;
  if (findingIds.has("pretooluse_never_fired")) score -= 15;
  if (findingIds.has("subagent_hooks_inert")) score -= 15;
  if (findingIds.has("counsel_deny_active_but_inert")) score -= 10;
  if (!handoffDiscoverOk) score -= 10;

  const stopCount = counts?.stop ?? 0;
  const subagentStart = counts?.subagentStart ?? 0;
  if (stopCount >= 5 && subagentStart / stopCount < 0.1) score -= 10;

  const completed = new Set((state?.completed ?? []).map((c) => c.function));
  if (completed.has("counsel")) score += 5;
  if (subagentStart >= 3) score += 5;
  if (handoffDiscoverOk) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function recommendProfile({ behaviorScore, findings, state, graduation }) {
  const critical = findings.filter((f) => f.severity === "critical");
  const findingIds = new Set(findings.map((f) => f.id));
  const completed = new Set((state?.completed ?? []).map((c) => c.function));

  const counselOk =
    completed.has("counsel") ||
    (!findingIds.has("pretooluse_never_fired") && !findingIds.has("t3_critical_lanes_incomplete"));

  if (
    behaviorScore >= (graduation?.promoteScoreMin ?? 80) &&
    critical.length === 0 &&
    counselOk
  ) {
    return "strict";
  }
  return "balanced";
}

export function resolveActiveProfileForAudit() {
  if (process.env.GOVERNANCE_ENFORCEMENT_PROFILE?.trim()) {
    return getEnforcementProfile();
  }
  const fileRec = readEnforcementProfileFile();
  if (fileRec?.profile) {
    return {
      profile: fileRec.profile,
      source: fileRec.source ?? "hooks-output",
    };
  }
  const handoff = getEnforcementProfile();
  if (handoff.source === "handoff") return handoff;
  return getEnforcementProfile();
}

/**
 * Auto-demote strict → balanced on regression. Never auto-promote to strict.
 * @returns {{ demoted: boolean, reason?: string }}
 */
export function maybeAutoDemote({ grade, behaviorScore, criticalCount, emitSignal }) {
  const grad = loadGraduationConfig();
  if (!grad.autoDemote) return { demoted: false };

  const active = resolveActiveProfileForAudit();
  if (active.profile !== "strict") return { demoted: false };

  const history = appendScoreHistoryWeek({ behaviorScore, grade });

  const lowWeeks = (history.weeks ?? []).filter((w) => w.behaviorScore < grad.demoteScoreMax);
  const consecutiveLow =
    lowWeeks.length >= grad.demoteConsecutiveWeeks &&
    lowWeeks.slice(-grad.demoteConsecutiveWeeks).every((w) => w.behaviorScore < grad.demoteScoreMax);

  const severe = grade === "F" || criticalCount >= 2 || consecutiveLow;
  if (!severe) return { demoted: false };

  const reason = grade === "F"
    ? "auto-demote-regression-grade-F"
    : criticalCount >= 2
      ? "auto-demote-regression-critical"
      : "auto-demote-regression-score";

  writeEnforcementProfileFile("balanced", { source: "auto-demote", reason });
  return { demoted: true, reason, emitSignal: emitSignal ?? true };
}
