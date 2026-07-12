#!/usr/bin/env node
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { readHookInput, allow, deny, logHook, HOOK_MODE } from "./lib.mjs";
import { loadLaneState, laneGaps, tierAtLeast } from "./lane-state.mjs";
import { getProfileFlags } from "./enforcement-profile.mjs";
import { appendSignal } from "../../scripts/governance-learning.mjs";
import { loadCollaborationConfig, canLoadSpecializedSkills } from "./collaboration.mjs";

const input = readHookInput();
const status = input.status ?? "completed";

const state = loadLaneState();
const { missing } = laneGaps(state);
const tier = state.riskTier ?? "T1";

logHook("stop", { status, tier, lane_gaps: missing });

if (missing.length) {
  appendSignal(
    {
      kind: "lane_gap",
      riskTier: tier,
      pathClass: state.pathClass ?? "unknown",
      plannedLanes: state.plannedLanes ?? [],
      agentFunctions: (state.completed ?? []).map((c) => c.function),
      source: { plane: "runtime", artifact: "lane-gap-report" },
      hypothesis: `session ended with missing lanes: ${missing.join(", ")}`,
      metrics: { executionGap: true },
      detail: { missingLanes: missing, status },
    },
    { state, warnOnly: true },
  );
}

const { profile: enforcementProfile, stopDenyCriticalLanes } = getProfileFlags();

if (tierAtLeast(tier, "T3") && HOOK_MODE === "enforce") {
  const criticalMissing = missing.filter((l) =>
    ["counsel", "sentinel", "ai_governance_reviewer"].includes(l),
  );
  if (criticalMissing.length) {
    const msg = `T3+ missing lanes: ${criticalMissing.join(", ")} — handoff + governance:audit before merge`;
    logHook("stop", {
      blocked: true,
      criticalMissing,
      enforcementProfile,
      stopDenyApplied: stopDenyCriticalLanes,
    });
    if (stopDenyCriticalLanes) {
      const userMsg = `Session stop blocked (${enforcementProfile}): missing ${criticalMissing.join(", ")}`;
      console.log(deny(userMsg, msg));
      process.exit(2);
    }
    console.log(allow({ hook_note: msg }));
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
  collaboration: {
    phase: state.collaborationPhase ?? "proposal",
    revalidationConfirmed: state.revalidationConfirmed ?? false,
    outputReviewPassed: state.outputReviewPassed ?? false,
    humanDecisionRecordComplete: Boolean(state.humanDecisionRecord?.principal),
    specializedUnlocked: canLoadSpecializedSkills(state),
  },
};
writeFileSync(join(outDir, "lane-gap-report.json"), JSON.stringify(gapReport, null, 2));

console.log(allow());
process.exit(0);
