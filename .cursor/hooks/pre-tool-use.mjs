#!/usr/bin/env node
import { readHookInput, allow, logHook, HOOK_MODE, deny, rolloutDateReached } from "./lib.mjs";
import { loadLaneState, laneGaps, tierAtLeast, criticalLanesForTier, saveLaneState } from "./lane-state.mjs";
import { appendSignal } from "../../scripts/governance-learning.mjs";
import {
  loadCollaborationConfig,
  canLoadSpecializedSkills,
  collaborationGateEnforceReached,
  inferActionClassFromTask,
  actionClassRequiresSpecializedGate,
  promptReferencesSpecializedSkill,
} from "./collaboration.mjs";

const input = readHookInput();
const toolName = input.tool_name ?? input.toolName ?? "";
const toolInput = input.tool_input ?? input.toolInput ?? {};

if (toolName !== "Task" && !toolName.includes("Task")) {
  console.log(allow());
  process.exit(0);
}

const state = loadLaneState();
const tier = state.riskTier ?? "T1";
const taskDesc = JSON.stringify(toolInput).slice(0, 200);
const collabConfig = loadCollaborationConfig();

const started = new Set((state.started ?? []).map((s) => s.function));
const completed = new Set((state.completed ?? []).map((c) => c.function));

function laneSatisfied(lane) {
  return started.has(lane) || completed.has(lane);
}

if (tierAtLeast(tier, "T3")) {
  const critical = criticalLanesForTier(tier);
  const missingCritical = critical.filter((l) => !laneSatisfied(l));
  const isBuilderTask = /builder|implement|fix|edit/i.test(taskDesc);

  if (isBuilderTask && missingCritical.includes("counsel")) {
    const msg = `T3+ Task blocked: counsel lane must run before builder (missing: ${missingCritical.join(", ")})`;
    logHook("preToolUse", { tool: toolName, tier, blocked: true, reason: "counsel" });

    appendSignal(
      {
        kind: HOOK_MODE === "enforce" ? "hook_deny" : "composition_miss",
        riskTier: tier,
        pathClass: state.pathClass ?? "unknown",
        plannedLanes: state.plannedLanes ?? [],
        agentFunctions: [...completed],
        source: { plane: "runtime", artifact: "pre-tool-use" },
        hypothesis: "counsel lane must run before builder on T3+",
        metrics: { compositionMiss: true, executionGap: true },
        detail: { missingCritical, blocked: HOOK_MODE === "enforce" },
      },
      { state, warnOnly: true },
    );

    if (HOOK_MODE === "enforce" && rolloutDateReached("preToolUseDenyT3From")) {
      console.log(deny(msg, msg));
      process.exit(2);
    }
    console.log(allow({ hook_note: `[${rolloutDateReached("preToolUseDenyT3From") ? "enforce" : "shadow-until-rollout"}] ${msg}` }));
    process.exit(0);
  }
}

if (collabConfig.enabled && tier !== "T0") {
  const actionClass = inferActionClassFromTask(taskDesc, collabConfig);
  const needsSpecializedGate = actionClassRequiresSpecializedGate(actionClass, collabConfig);
  const taskSkills = promptReferencesSpecializedSkill(taskDesc, collabConfig);
  const blockedCollaboration =
    (needsSpecializedGate || taskSkills.length > 0) && !canLoadSpecializedSkills(state);

  if (blockedCollaboration) {
    const msg = `Collaboration plane: Task requires revalidation before specialized delegation (actionClass=${actionClass}; phase=${state.collaborationPhase ?? "proposal"})`;
    logHook("preToolUse", { tool: toolName, tier, blocked: true, reason: "collaboration_gate" });

    appendSignal(
      {
        kind: "collaboration_gate",
        riskTier: tier,
        pathClass: state.pathClass ?? "unknown",
        plannedLanes: state.plannedLanes ?? [],
        source: { plane: "collaboration", artifact: "pre-tool-use" },
        hypothesis: msg,
        detail: { actionClass, taskSkills, revalidationConfirmed: state.revalidationConfirmed },
      },
      { state, warnOnly: true },
    );

    const enforceCollab =
      HOOK_MODE === "enforce" &&
      collaborationGateEnforceReached(collabConfig) &&
      (needsSpecializedGate || taskSkills.length > 0);

    if (enforceCollab) {
      console.log(deny(msg, msg));
      process.exit(2);
    }
    console.log(allow({ hook_note: `[collaboration-shadow] ${msg}` }));
    process.exit(0);
  }
}

console.log(allow());
process.exit(0);
