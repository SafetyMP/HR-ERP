#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readHookInput, allow, logHook } from "./lib.mjs";
import { loadLaneState, recordSubagentStart, syncPlanFromLint } from "./lane-state.mjs";

const input = readHookInput();
const subagentType = input.subagent_type ?? input.subagentType ?? "unknown";
const task = input.task ?? input.prompt ?? "";

const state = loadLaneState();
const plan = syncPlanFromLint(state);
if (!state.sessionId) {
  state.sessionId = input.session_id ?? input.conversation_id ?? Date.now().toString(36);
}

recordSubagentStart(state, {
  subagentType,
  task,
  functionId: input.function ?? input.lane,
});

logHook("subagentStart", { subagent_type: subagentType, task: task.slice(0, 120) });

let planContext = "";
try {
  planContext = execSync("node scripts/governance-lint.mjs plan --json --quiet 2>/dev/null", {
    encoding: "utf8",
    cwd: process.cwd(),
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
} catch {
  planContext = plan ? JSON.stringify(plan) : "";
}

const agentMessage = planContext
  ? `Governance plan (inject into subagent context):\n${planContext}`
  : undefined;

console.log(allow({ agent_message: agentMessage }));
process.exit(0);
