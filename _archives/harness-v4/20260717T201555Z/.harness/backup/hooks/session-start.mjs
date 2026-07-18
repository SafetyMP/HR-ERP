#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readHookInput, allow, logHook, HOOK_MODE, rolloutDateReached } from "./lib.mjs";
import { loadLaneState, saveLaneState, refreshGovernanceCache } from "./lane-state.mjs";
import { getEnforcementProfile } from "./enforcement-profile.mjs";

const input = readHookInput();
const state = loadLaneState();

state.sessionId = input.session_id ?? input.conversation_id ?? Date.now().toString(36);
state.started = [];
state.completed = [];

try {
  const branch = execSync("git branch --show-current 2>/dev/null", {
    encoding: "utf8",
    cwd: process.cwd(),
  }).trim();
  state.ticketId = branch.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || null;
} catch {
  state.ticketId = null;
}

const { plan } = refreshGovernanceCache(state, { force: true });

logHook("sessionStart", { sessionId: state.sessionId, tier: state.riskTier });
saveLaneState(state);

const rolloutBits = [
  `counselFallback:${HOOK_MODE === "enforce" ? "deny" : "shadow"}`,
  `handoffStrict:${rolloutDateReached("handoffDiscoverStrictFrom") ? "on" : "pending"}`,
  `collabGate:${rolloutDateReached("collaborationGateEnforceFrom") ? "on" : "pending"}`,
  `preToolUseDeny:${rolloutDateReached("preToolUseDenyT3From") ? "on" : "pending"}`,
  `laneAuthority:${rolloutDateReached("laneStateShadowUntil") ? "on" : "pending"}`,
];

const enforcement = getEnforcementProfile();
const enforcementLine = `Enforcement: ${enforcement.profile} (${enforcement.source})`;

const lines = [
  `Harness ${HOOK_MODE} | rollout: ${rolloutBits.join(" ")}`,
  enforcementLine,
  "Operator: docs/meta/agent-team-map.md → governance:lint → governance:plan → /multitask (function: lane in prompts)",
];
if (plan?.requiredLanes?.length) {
  lines.push(`Required lanes: ${plan.requiredLanes.join(", ")}`);
}
if (plan?.riskTier && plan.riskTier !== "T0") {
  lines.push("T2+: specs/**/orchestrator-handoff.json aligned to diff");
}

console.log(allow({ additional_context: lines.join("\n") }));
process.exit(0);
