/**
 * Collaboration plane (Harness HITL) — lane state helpers and manifest lookups.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadManifest } from "../../scripts/governance-manifest.mjs";

const HOOK_MODE_PATH = join(process.cwd(), ".cursor", "governance", "hook-mode.json");

function tierAtLeast(actual, required) {
  const order = ["T0", "T1", "T2", "T3", "T4"];
  return order.indexOf(actual) >= order.indexOf(required);
}

export const COLLABORATION_PHASES = [
  "proposal",
  "options",
  "human_input",
  "execute_plan",
  "revalidation",
  "specialized",
  "output_review",
  "complete",
];

export function defaultCollaborationState() {
  return {
    collaborationPhase: "proposal",
    humanDecisionRecord: null,
    revalidationPending: false,
    revalidationDeadline: null,
    revalidationConfirmed: false,
    specializedSkillsUnlocked: [],
    outputReviewPassed: false,
  };
}

export function ensureCollaborationFields(state) {
  const defaults = defaultCollaborationState();
  for (const [k, v] of Object.entries(defaults)) {
    if (state[k] === undefined) state[k] = v;
  }
  return state;
}

export function loadCollaborationConfig() {
  const manifest = loadManifest();
  const collab = manifest.collaboration ?? {};
  let hookMode = {};
  try {
    if (existsSync(HOOK_MODE_PATH)) {
      hookMode = JSON.parse(readFileSync(HOOK_MODE_PATH, "utf8"));
    }
  } catch {
    /* optional */
  }
  return {
    enabled: collab.enabled !== false,
    minTier: collab.minTier ?? "T1",
    skillPhases: collab.skillPhases ?? { routing: [], execution: [], specialized: [] },
    actionClasses: collab.actionClasses ?? {},
    timeoutPolicy: hookMode.collaborationTimeoutPolicy ?? collab.timeoutPolicy ?? "deny",
    revalidationTimeoutHours: hookMode.collaborationRevalidationTimeoutHours ?? 24,
    requireHandoffRevalidationAtTier: collab.requireHandoffRevalidationAtTier ?? "T3",
    shadowUntil: collab.shadowUntil,
    gateEnforceFrom: hookMode.v4Rollout?.collaborationGateEnforceFrom,
  };
}

export function specializedSkillIds(config) {
  return (config.skillPhases.specialized ?? []).map((s) => s.toLowerCase());
}

export function promptReferencesSpecializedSkill(prompt, config) {
  const ids = specializedSkillIds(config);
  const lower = (prompt ?? "").toLowerCase();
  return ids.filter((id) => lower.includes(`@${id}`) || lower.includes(id));
}

export function canLoadSpecializedSkills(state) {
  ensureCollaborationFields(state);
  const phase = state.collaborationPhase ?? "proposal";
  const phaseOk = ["specialized", "output_review", "complete"].includes(phase);
  return Boolean(state.revalidationConfirmed && phaseOk);
}

export function collaborationGateEnforceReached(config) {
  if (!config.gateEnforceFrom) return false;
  const d = new Date(config.gateEnforceFrom);
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() >= d.getTime();
}

export function onRevalidationTimeout(state) {
  ensureCollaborationFields(state);
  state.revalidationPending = false;
  state.revalidationConfirmed = false;
  state.specializedSkillsUnlocked = [];
  state.collaborationPhase = "revalidation";
  return state;
}

export function isRevalidationExpired(state, config) {
  if (!state.revalidationPending || !state.revalidationDeadline) return false;
  const deadline = new Date(state.revalidationDeadline);
  if (Number.isNaN(deadline.getTime())) return false;
  return Date.now() > deadline.getTime();
}

export function inferActionClassFromTask(taskDesc, config) {
  const t = (taskDesc ?? "").toLowerCase();
  const classes = config.actionClasses ?? {};
  if (/ddl|migration|custodian|schema\.prisma|payroll|compliance|mcp|lib\/copilot/.test(t)) {
    return "irreversible_or_regulated";
  }
  if (/builder|implement|fix|edit|write/.test(t)) {
    return "reversible_write";
  }
  if (/scout|explore|read|review|readonly|grep|search/.test(t)) {
    return "read_only";
  }
  const regulated = classes.irreversible_or_regulated?.examples ?? [];
  for (const ex of regulated) {
    if (t.includes(String(ex).toLowerCase())) return "irreversible_or_regulated";
  }
  return "reversible_write";
}

export function actionClassRequiresSpecializedGate(actionClass, config) {
  const gate = config.actionClasses?.[actionClass]?.gate;
  return gate === "hitl_specialized";
}

export function oversightModeForPhase(phase) {
  if (phase === "human_input" || phase === "specialized") return "HITL";
  return "HOTL";
}

export function buildCollaborationPlanStub(plan, tier) {
  const triggers = plan?.matchedTriggers ?? [];
  return {
    phase: tier === "T0" ? "complete" : "options",
    oversightMode: tier === "T0" ? "HOTL" : "HOTL",
    decisionOverview: triggers.length
      ? `Work triggered by: ${triggers.map((t) => t.id).join(", ")}`
      : "Fill decision overview in specs/templates/collaboration-plan.md",
    options: [],
    recommendedStrategyId: null,
    humanDecisionRecord: null,
    revalidationRequired: tier !== "T0",
    revalidationConfirmed: false,
    outputReviewRequired: tier !== "T0",
    outputReviewPassed: false,
    actionClassesTriggered: [],
  };
}

export function handoffRequiresRevalidationStrict(tier, config) {
  const min = config.requireHandoffRevalidationAtTier ?? "T3";
  return tierAtLeast(tier, min);
}
