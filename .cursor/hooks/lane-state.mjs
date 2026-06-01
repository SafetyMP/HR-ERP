/**
 * Session lane state for governance hooks (gitignored output).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import {
  getWorkingTreeFingerprint,
  listWorkingTreeFiles,
  loadDynamicEnforcementConfig,
  shouldRefreshGovernance,
} from "./hook-dynamic.mjs";
import { tierAtLeast } from "./lib.mjs";

const STATE_PATH = join(process.cwd(), ".cursor", "hooks-output", "session-lane-state.json");

export function loadLaneState() {
  if (!existsSync(STATE_PATH)) {
    return {
      sessionId: null,
      riskTier: "T1",
      plannedLanes: [],
      suggestedSkills: [],
      started: [],
      completed: [],
      skillsLoaded: [],
      signalsEmitted: [],
      poInjectCount: 0,
      updatedAt: null,
      collaborationPhase: "proposal",
      humanDecisionRecord: null,
      revalidationPending: false,
      revalidationDeadline: null,
      revalidationConfirmed: false,
      specializedSkillsUnlocked: [],
      outputReviewPassed: false,
      governanceCache: null,
      lastInjectedTier: null,
      lastInjectedPathClass: null,
      lastInjectedCollabPhase: null,
    };
  }
  try {
    const state = JSON.parse(readFileSync(STATE_PATH, "utf8"));
    state.skillsLoaded = state.skillsLoaded ?? [];
    state.signalsEmitted = state.signalsEmitted ?? [];
    state.poInjectCount = state.poInjectCount ?? 0;
    state.collaborationPhase = state.collaborationPhase ?? "proposal";
    state.revalidationPending = state.revalidationPending ?? false;
    state.revalidationConfirmed = state.revalidationConfirmed ?? false;
    state.specializedSkillsUnlocked = state.specializedSkillsUnlocked ?? [];
    state.outputReviewPassed = state.outputReviewPassed ?? false;
    state.governanceCache = state.governanceCache ?? null;
    state.lastInjectedTier = state.lastInjectedTier ?? null;
    state.lastInjectedPathClass = state.lastInjectedPathClass ?? null;
    state.lastInjectedCollabPhase = state.lastInjectedCollabPhase ?? null;
    return state;
  } catch {
    return {
      plannedLanes: [],
      started: [],
      completed: [],
      skillsLoaded: [],
      signalsEmitted: [],
      poInjectCount: 0,
      collaborationPhase: "proposal",
      revalidationConfirmed: false,
      specializedSkillsUnlocked: [],
      outputReviewPassed: false,
    };
  }
}

export function saveLaneState(state) {
  const dir = join(process.cwd(), ".cursor", "hooks-output");
  mkdirSync(dir, { recursive: true });
  state.updatedAt = new Date().toISOString();
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function planSummaryFromPlan(plan, tier) {
  if (!plan) return null;
  return {
    tier: plan.riskTier ?? tier,
    requiredLanes: plan.requiredLanes ?? [],
    plannedLanes: (plan.delegatedTaskPlan ?? []).map((p) => p.function).filter(Boolean),
    regulatedGraph: plan.regulatedGraph ?? false,
    pathClass: plan.matchedTriggers?.[0]?.id ?? null,
    suggestedSkills: plan.suggestedSkills ?? [],
  };
}

function applyPlanToState(state, plan, tier) {
  state.riskTier = tier;
  if (plan) {
    state.plannedLanes = (plan.delegatedTaskPlan ?? []).map((p) => p.function).filter(Boolean);
    state.regulatedGraph = plan.regulatedGraph ?? false;
    if (plan.matchedTriggers?.length) {
      state.pathClass = plan.matchedTriggers[0].id;
    }
    if (plan.suggestedSkills?.length) {
      state.suggestedSkills = plan.suggestedSkills;
    }
    state.governanceCache = state.governanceCache ?? {};
    state.governanceCache.planSummary = planSummaryFromPlan(plan, tier);
  }
}

/**
 * Refresh tier/plan from governance-lint when working-tree fingerprint changes (or force).
 * @returns {{ plan: object|null, tier: string, fromCache: boolean, diffFiles: string[] }}
 */
export function refreshGovernanceCache(state, { force = false } = {}) {
  const dyn = loadDynamicEnforcementConfig();
  const fp = getWorkingTreeFingerprint();
  const cached = state.governanceCache;

  if (
    dyn.enabled &&
    !force &&
    !shouldRefreshGovernance(state, { force: false }) &&
    cached?.tier &&
    (cached?.planSummary || cached?.plan)
  ) {
    let plan = null;
    if (cached.plan) {
      try {
        plan = JSON.parse(cached.plan);
      } catch {
        plan = null;
      }
    }
    if (!plan && cached.planSummary) {
      plan = {
        riskTier: cached.tier,
        requiredLanes: cached.planSummary.requiredLanes,
        delegatedTaskPlan: (cached.planSummary.plannedLanes ?? []).map((fn) => ({ function: fn })),
        regulatedGraph: cached.planSummary.regulatedGraph,
        matchedTriggers: cached.planSummary.pathClass
          ? [{ id: cached.planSummary.pathClass }]
          : [],
        suggestedSkills: cached.planSummary.suggestedSkills,
      };
    }
    applyPlanToState(state, plan, cached.tier);
    saveLaneState(state);
    return {
      plan,
      tier: cached.tier,
      fromCache: true,
      diffFiles: cached.diffFiles ?? [],
    };
  }

  let plan = null;
  let tier = state.riskTier ?? "T1";

  try {
    const out = execSync("node scripts/governance-lint.mjs plan --json --quiet 2>/dev/null", {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    plan = JSON.parse(out.trim());
    if (plan.riskTier) tier = plan.riskTier;
  } catch {
    /* keep prior tier */
  }

  try {
    const diffOut = execSync("node scripts/governance-lint.mjs diff 2>/dev/null", {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    const m = diffOut.match(/Suggested riskTier:\s*(T\d)/);
    if (m) tier = m[1];
  } catch {
    /* keep plan tier */
  }

  const diffFiles = listWorkingTreeFiles();
  state.governanceCache = {
    diffFingerprint: fp,
    planSummary: planSummaryFromPlan(plan, tier),
    tier,
    diffFiles,
    refreshedAt: new Date().toISOString(),
  };

  applyPlanToState(state, plan, tier);
  saveLaneState(state);

  return { plan, tier, fromCache: false, diffFiles };
}

/** @deprecated Use refreshGovernanceCache — kept for session/subagent hooks */
export function syncPlanFromLint(state, options = {}) {
  const { plan } = refreshGovernanceCache(state, options);
  return plan;
}

export function extractSkillIdsFromText(text) {
  const ids = new Set();
  const re = /@([a-z0-9][a-z0-9-]*)/gi;
  let m;
  while ((m = re.exec(text ?? "")) !== null) {
    ids.add(m[1].toLowerCase());
  }
  return [...ids];
}

export function recordSkillsLoaded(state, skillIds, { source, maxBodies = 3 } = {}) {
  const normalized = (skillIds ?? []).map((s) => s.replace(/^@/, "").toLowerCase()).filter(Boolean);
  if (!normalized.length) return { added: [], total: state.skillsLoaded?.length ?? 0 };

  state.skillsLoaded = state.skillsLoaded ?? [];
  const added = [];
  for (const id of normalized) {
    if (!state.skillsLoaded.includes(id)) {
      state.skillsLoaded.push(id);
      added.push(id);
    }
  }
  state.lastSkillSource = source ?? "unknown";
  saveLaneState(state);
  return { added, total: state.skillsLoaded.length, overCap: state.skillsLoaded.length > maxBodies };
}

export function recordSubagentStart(state, { subagentType, task, functionId }) {
  const entry = {
    function: functionId ?? inferFunctionFromTask(task, subagentType),
    subagentType,
    startedAt: new Date().toISOString(),
    taskPreview: (task ?? "").slice(0, 120),
  };
  state.started.push(entry);
  recordSkillsLoaded(state, extractSkillIdsFromText(task), { source: "subagent-start" });
  saveLaneState(state);
  return entry;
}

export function recordSubagentStop(state, { subagentType, task, outputPreview }) {
  const fn = inferFunctionFromTask(task, subagentType);
  const hash = outputPreview
    ? createHash("sha256").update(outputPreview).digest("hex").slice(0, 16)
    : null;
  state.completed.push({
    function: fn,
    subagentType,
    completedAt: new Date().toISOString(),
    outputHash: hash,
  });
  recordSkillsLoaded(state, extractSkillIdsFromText(task), { source: "subagent-stop" });
  saveLaneState(state);
  return fn;
}

export function parseFunctionFromTask(task) {
  const m = (task ?? "").match(/\bfunction:\s*([a-z_]+)/i);
  return m ? m[1].toLowerCase() : null;
}

function inferFunctionFromTask(task, subagentType) {
  const explicit = parseFunctionFromTask(task);
  if (explicit) return explicit;
  const t = `${task ?? ""} ${subagentType ?? ""}`.toLowerCase();
  const lanes = [
    "ai_governance_reviewer",
    "mlops_reviewer",
    "finops_coordinator",
    "release_ops",
    "architect",
    "custodian",
    "packaging",
    "counsel",
    "sentinel",
    "verifier",
    "builder",
    "scout",
    "integrator",
    "advocate",
  ];
  for (const lane of lanes) {
    if (t.includes(lane.replace(/_/g, " ")) || t.includes(lane)) return lane;
  }
  if (subagentType === "explore") return "scout";
  if (subagentType === "shell") return "release_ops";
  return subagentType ?? "unknown";
}

export function laneGaps(state) {
  const planned = new Set(state.plannedLanes ?? []);
  const completed = new Set((state.completed ?? []).map((c) => c.function));
  const missing = [...planned].filter((l) => !completed.has(l));
  return { planned: [...planned], completed: [...completed], missing };
}

export function criticalLanesForTier(tier) {
  if (tierAtLeast(tier, "T3")) return ["counsel", "sentinel", "ai_governance_reviewer"];
  if (tierAtLeast(tier, "T2")) return ["sentinel"];
  return [];
}

export { tierAtLeast };
