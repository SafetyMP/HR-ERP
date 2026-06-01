#!/usr/bin/env node
import { readHookInput, allow, logHook, tierAtLeast } from "./lib.mjs";
import { loadLaneState, saveLaneState } from "./lane-state.mjs";

const input = readHookInput();
const filePath = input.file_path ?? input.path ?? "";

logHook("afterFileEdit", { file_path: filePath });

const state = loadLaneState();
const tier = state.riskTier ?? "T1";
const appPath =
  tierAtLeast(tier, "T2") &&
  filePath &&
  /^(src\/|lib\/|packages\/|services\/|workers\/)/.test(filePath) &&
  !filePath.startsWith("specs/");

if (appPath) {
  state.builderActivityAt = new Date().toISOString();
  saveLaneState(state);
}

console.log(allow());
process.exit(0);
