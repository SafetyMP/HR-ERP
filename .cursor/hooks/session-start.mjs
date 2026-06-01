#!/usr/bin/env node
import { readHookInput, allow, logHook, HOOK_MODE, rolloutDateReached } from "./lib.mjs";
import { loadLaneState, saveLaneState, refreshGovernanceCache } from "./lane-state.mjs";

const input = readHookInput();
const state = loadLaneState();

state.sessionId = input.session_id ?? input.conversation_id ?? Date.now().toString(36);
state.started = [];
state.completed = [];
const { plan } = refreshGovernanceCache(state, { force: true });

logHook("sessionStart", { sessionId: state.sessionId, tier: state.riskTier });
saveLaneState(state);

const lines = [
  "Operator loop (T1+): load docs/meta/agent-team-map.md → npm run governance:lint → npm run governance:plan",
  "Fan-out: /multitask (scout+architect, sentinel+verifier) · DDL: /worktree · merge: npm run governance:ci",
  `Hook mode: ${HOOK_MODE} | counsel-before-builder enforce: ${rolloutDateReached("preToolUseDenyT3From") ? "active" : "after 2026-06-20"}`,
];
if (plan?.requiredLanes?.length) {
  lines.push(`Required lanes: ${plan.requiredLanes.join(", ")}`);
}
if (plan?.riskTier && plan.riskTier !== "T0") {
  lines.push(
    "T2+: commit specs/**/orchestrator-handoff.json with delegatedTaskPlan matching Required lanes",
  );
}

console.log(allow({ additional_context: lines.join("\n") }));
process.exit(0);
