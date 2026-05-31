/**
 * Session lane state for governance hooks (gitignored output).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

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

export function syncPlanFromLint(state) {
  try {
    const out = execSync("node scripts/governance-lint.mjs plan --json --quiet 2>/dev/null", {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    const plan = JSON.parse(out.trim());
    state.riskTier = plan.riskTier;
    state.plannedLanes = (plan.delegatedTaskPlan ?? []).map((p) => p.function).filter(Boolean);
    state.regulatedGraph = plan.regulatedGraph ?? false;
    if (plan.matchedTriggers?.length) {
      state.pathClass = plan.matchedTriggers[0].id;
    }
    if (plan.suggestedSkills?.length) {
      state.suggestedSkills = plan.suggestedSkills;
    }
    saveLaneState(state);
    return plan;
  } catch {
    return null;
  }
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

function inferFunctionFromTask(task, subagentType) {
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

function tierAtLeast(actual, required) {
  const order = ["T0", "T1", "T2", "T3", "T4"];
  return order.indexOf(actual) >= order.indexOf(required);
}

export { tierAtLeast };
