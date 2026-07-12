#!/usr/bin/env node
import { readHookInput, allow, logHook } from "./lib.mjs";
import {
  loadLaneState,
  recordSubagentStart,
  refreshGovernanceCache,
  parseFunctionFromTask,
} from "./lane-state.mjs";

const input = readHookInput();
const subagentType = input.subagent_type ?? input.subagentType ?? "unknown";
const task = input.task ?? input.prompt ?? "";

const state = loadLaneState();
if (!state.sessionId) {
  state.sessionId = input.session_id ?? input.conversation_id ?? Date.now().toString(36);
}

const { plan, fromCache } = refreshGovernanceCache(state);

const functionId =
  input.function ?? input.lane ?? parseFunctionFromTask(task) ?? undefined;

recordSubagentStart(state, {
  subagentType,
  task,
  functionId,
});

logHook("subagentStart", {
  subagent_type: subagentType,
  task: task.slice(0, 120),
  governance_cache: fromCache,
});

const planContext = plan ? JSON.stringify(plan) : "";

const agentMessage = planContext
  ? `Governance plan (inject into subagent context):\n${planContext}`
  : undefined;

console.log(allow({ agent_message: agentMessage }));
process.exit(0);
