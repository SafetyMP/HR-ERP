#!/usr/bin/env node
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { readHookInput, allow, logHook, HOOK_MODE, deny } from "./lib.mjs";
import { loadLaneState, laneGaps, tierAtLeast, criticalLanesForTier } from "./lane-state.mjs";

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
    if (HOOK_MODE === "enforce") {
      console.log(deny(msg, msg));
      process.exit(2);
    }
    console.log(allow({ hook_note: `[shadow] ${msg}` }));
    process.exit(0);
  }
}

console.log(allow());
process.exit(0);
