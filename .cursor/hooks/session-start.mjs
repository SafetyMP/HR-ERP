#!/usr/bin/env node
import { readHookInput, allow, logHook } from "./lib.mjs";
import { loadLaneState, saveLaneState, syncPlanFromLint } from "./lane-state.mjs";

const input = readHookInput();
const state = loadLaneState();

state.sessionId = input.session_id ?? input.conversation_id ?? Date.now().toString(36);
state.started = [];
state.completed = [];
syncPlanFromLint(state);

logHook("sessionStart", { sessionId: state.sessionId, tier: state.riskTier });
saveLaneState(state);

console.log(allow());
process.exit(0);
