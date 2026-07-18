#!/usr/bin/env node
import { readHookInput, allow, logHook } from "./lib.mjs";
import { loadLaneState, recordSubagentStop } from "./lane-state.mjs";
import { appendSignal } from "../../scripts/governance-learning.mjs";

const input = readHookInput();
const subagentType = input.subagent_type ?? input.subagentType ?? "unknown";
const task = input.task ?? "";
const outputPreview = input.output ?? input.result ?? "";

const state = loadLaneState();
const fn = recordSubagentStop(state, { subagentType, task, outputPreview });

if ((state.skillsLoaded?.length ?? 0) > 3) {
  appendSignal(
    {
      kind: "composition_miss",
      riskTier: state.riskTier ?? "T1",
      pathClass: state.pathClass ?? "unknown",
      plannedLanes: state.plannedLanes ?? [],
      source: { plane: "runtime", artifact: "subagent-stop" },
      hypothesis: "subagent session exceeded maxSkillBodies",
      detail: { skillsLoaded: state.skillsLoaded, function: fn },
    },
    { state, dedupeKey: `composition:subagent-stop:${fn}`, warnOnly: true },
  );
}

logHook("subagentStop", { subagent_type: subagentType, function: fn, task: task.slice(0, 80) });

console.log(allow());
process.exit(0);
