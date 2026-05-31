#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readHookInput, allow, logHook } from "./lib.mjs";
import { loadLaneState, syncPlanFromLint, laneGaps } from "./lane-state.mjs";

const input = readHookInput();
const prompt = input.prompt ?? input.text ?? "";

const state = loadLaneState();
syncPlanFromLint(state);

let tier = state.riskTier ?? "T1";
try {
  const out = execSync("node scripts/governance-lint.mjs diff 2>/dev/null", {
    encoding: "utf8",
    cwd: process.cwd(),
  });
  const m = out.match(/Suggested riskTier:\s*(T\d)/);
  if (m) tier = m[1];
} catch {
  /* keep state tier */
}

state.riskTier = tier;
const { missing } = laneGaps(state);

logHook("beforeSubmitPrompt", { tier, prompt_len: prompt.length, lane_gaps: missing.length });

const lines = [];
if (tier !== "T0") {
  lines.push(`riskTier: ${tier}`);
  lines.push(
    "PO orchestration checkpoint: Feature brief or .cursor/plans/*.md | UAC count | gate Y/N | phase ADR: specs/alignment/decisions/0001-phase1-scope.md",
  );
  lines.push("Native runtime: /multitask parallel lanes; npm run governance:plan for DAG");
  if (state.plannedLanes?.length) {
    lines.push(`Planned lanes: ${state.plannedLanes.join(", ")}`);
  }
  if (missing.length) {
    lines.push(`Advisory — incomplete lanes: ${missing.join(", ")}`);
  }
} else {
  lines.push("step 1 chore N/A — verify diff is docs/copy only");
}

console.log(allow({ additional_context: lines.join("\n") }));
process.exit(0);
