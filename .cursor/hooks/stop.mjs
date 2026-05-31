#!/usr/bin/env node
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { readHookInput, allow, logHook, HOOK_MODE, deny } from "./lib.mjs";
import { loadLaneState, laneGaps, tierAtLeast } from "./lane-state.mjs";

const input = readHookInput();
const status = input.status ?? "completed";

const state = loadLaneState();
const { missing } = laneGaps(state);
const tier = state.riskTier ?? "T1";

logHook("stop", { status, tier, lane_gaps: missing });

if (tierAtLeast(tier, "T3") && HOOK_MODE === "enforce") {
  const criticalMissing = missing.filter((l) =>
    ["counsel", "sentinel", "ai_governance_reviewer"].includes(l),
  );
  if (criticalMissing.length) {
    const msg = `Session ending with missing T3+ lanes: ${criticalMissing.join(", ")} — complete handoff before merge`;
    logHook("stop", { blocked: true, criticalMissing });
    console.log(
      allow({
        agent_message: msg,
        hook_note: msg,
      }),
    );
  }
}

let body = "";
try {
  body = execSync("node scripts/governance-generate-pr-body.mjs", {
    encoding: "utf8",
    cwd: process.cwd(),
  });
} catch {
  body = "<!-- governance-generate-pr-body failed -->";
}

const outDir = join(process.cwd(), ".cursor", "hooks-output");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "pr-body-stub.md"), body);

const gapReport = {
  tier,
  missingLanes: missing,
  plannedLanes: state.plannedLanes ?? [],
  completed: (state.completed ?? []).map((c) => c.function),
  status,
  at: new Date().toISOString(),
};
writeFileSync(join(outDir, "lane-gap-report.json"), JSON.stringify(gapReport, null, 2));

console.log(allow());
process.exit(0);
