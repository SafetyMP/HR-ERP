#!/usr/bin/env node
import { readHookInput, allow, logHook, HOOK_MODE, deny } from "./lib.mjs";
import { loadLaneState, recordSubagentStop } from "./lane-state.mjs";

const input = readHookInput();
const subagentType = input.subagent_type ?? input.subagentType ?? "unknown";
const task = input.task ?? "";
const outputPreview = input.output ?? input.result ?? "";

const state = loadLaneState();
recordSubagentStop(state, { subagentType, task, outputPreview });

logHook("subagentStop", { subagent_type: subagentType, task: task.slice(0, 80) });

console.log(allow());
process.exit(0);
