/**
 * Dynamic governance enforcement for Cursor hooks.
 * Re-runs governance-lint when the working tree fingerprint changes; otherwise
 * reuses cached tier/plan. Injects full PO/collaboration context only on
 * tier/path/material lane-gap changes or on a compact reminder interval.
 */
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { loadHookModeConfig, tierAtLeast } from "./lib.mjs";
import { criticalLanesForTier } from "./lane-state.mjs";

export function loadDynamicEnforcementConfig() {
  const cfg = loadHookModeConfig();
  const dyn = cfg?.dynamicEnforcement ?? {};
  return {
    enabled: dyn.enabled !== false,
    poInjectEveryN: Number.isFinite(dyn.poInjectEveryN)
      ? dyn.poInjectEveryN
      : 10,
    compactContextOnStable: dyn.compactContextOnStable !== false,
    refreshOnDiffChange: dyn.refreshOnDiffChange !== false,
    fullInjectOnMaterialGapsOnly: dyn.fullInjectOnMaterialGapsOnly !== false,
  };
}

export function getWorkingTreeFingerprint(cwd = process.cwd()) {
  try {
    const out = execSync(
      [
        "git diff --name-only HEAD 2>/dev/null",
        "git diff --name-only --cached 2>/dev/null",
        "git ls-files --others --exclude-standard 2>/dev/null",
      ].join("\n"),
      { encoding: "utf8", cwd, maxBuffer: 512 * 1024 },
    );
    return createHash("sha256").update(out).digest("hex").slice(0, 16);
  } catch {
    return "unknown";
  }
}

export function listWorkingTreeFiles(cwd = process.cwd()) {
  try {
    const out = execSync("git diff --name-only HEAD 2>/dev/null", {
      encoding: "utf8",
      cwd,
      maxBuffer: 512 * 1024,
    });
    return out.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export function shouldRefreshGovernance(state, { force = false } = {}) {
  const dyn = loadDynamicEnforcementConfig();
  if (force || !dyn.enabled) return true;
  if (!dyn.refreshOnDiffChange) return false;
  const fp = getWorkingTreeFingerprint();
  return fp !== state.governanceCache?.diffFingerprint;
}

/** @typedef {"full" | "compact" | "skip" | "t0"} InjectProfile */

/**
 * Material gaps: required lanes or T3+ critical lanes missing (not all planned lanes).
 * @param {{ tier: string, missing: string[], requiredLanes?: string[], plannedLanes?: string[] }}
 */
export function hasMaterialLaneGaps({
  tier,
  missing,
  requiredLanes = [],
  plannedLanes = [],
}) {
  if (!missing?.length) return false;
  const dyn = loadDynamicEnforcementConfig();
  if (!dyn.fullInjectOnMaterialGapsOnly) return true;

  const reqSet = new Set(requiredLanes);
  if (missing.some((l) => reqSet.has(l))) return true;

  if (tierAtLeast(tier, "T3")) {
    const critical = new Set(criticalLanesForTier(tier));
    if (missing.some((l) => critical.has(l))) return true;
  }

  return false;
}

/**
 * Choose how much hook context to inject on beforeSubmitPrompt.
 * @param {Record<string, unknown>} state
 * @param {{ tier: string, missing: string[], requiredLanes?: string[] }} options
 * @returns {InjectProfile}
 */
export function selectInjectProfile(
  state,
  { tier, missing, requiredLanes = [] },
) {
  const dyn = loadDynamicEnforcementConfig();
  if (!dyn.enabled) return "full";
  if (tier === "T0") return "t0";

  const tierChanged =
    state.lastInjectedTier != null && state.lastInjectedTier !== tier;
  const pathChanged =
    state.lastInjectedPathClass != null &&
    state.lastInjectedPathClass !== (state.pathClass ?? null);
  const phaseChanged =
    state.lastInjectedCollabPhase != null &&
    state.lastInjectedCollabPhase !== (state.collaborationPhase ?? "proposal");
  const materialGaps = hasMaterialLaneGaps({
    tier,
    missing,
    requiredLanes,
    plannedLanes: state.plannedLanes ?? [],
  });
  const firstInject = state.lastInjectedTier == null;

  if (
    firstInject ||
    tierChanged ||
    pathChanged ||
    materialGaps ||
    phaseChanged
  ) {
    return "full";
  }

  const n = Math.max(1, dyn.poInjectEveryN);
  if (dyn.compactContextOnStable && (state.poInjectCount ?? 0) % n === 0) {
    return "compact";
  }

  return "skip";
}

export function markInjectProfile(state, { tier, profile }) {
  if (profile === "full" || profile === "compact") {
    state.lastInjectedTier = tier;
    state.lastInjectedPathClass = state.pathClass ?? null;
    state.lastInjectedCollabPhase = state.collaborationPhase ?? "proposal";
  }
}

export function tierNeedsCollaborationEnforcement(tier) {
  return tierAtLeast(tier, "T2");
}

export function tierNeedsRouterHints(tier) {
  return tierAtLeast(tier, "T1");
}
