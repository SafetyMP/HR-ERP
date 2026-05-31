#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readHookInput, allow, logHook, HOOK_MODE, rolloutDateReached } from "./lib.mjs";
import { loadLaneState, syncPlanFromLint, laneGaps, saveLaneState, recordSkillsLoaded } from "./lane-state.mjs";
import { appendSignal, shouldRouterHintsShadow, shouldRouterHintsEnforce } from "../../scripts/governance-learning.mjs";
import { loadManifest, matchPath } from "../../scripts/governance-manifest.mjs";
import {
  loadCollaborationConfig,
  promptReferencesSpecializedSkill,
  canLoadSpecializedSkills,
  isRevalidationExpired,
  onRevalidationTimeout,
  oversightModeForPhase,
} from "./collaboration.mjs";

const input = readHookInput();
const prompt = input.prompt ?? input.text ?? "";

const state = loadLaneState();
const plan = syncPlanFromLint(state);

let tier = state.riskTier ?? "T1";
let matchedTriggers = [];
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

if (plan?.matchedTriggers?.length) {
  matchedTriggers = plan.matchedTriggers;
  state.pathClass = matchedTriggers[0]?.id ?? state.pathClass;
}

state.riskTier = tier;
saveLaneState(state);

const { missing } = laneGaps(state);

logHook("beforeSubmitPrompt", { tier, prompt_len: prompt.length, lane_gaps: missing.length });

state.poInjectCount = (state.poInjectCount ?? 0) + 1;
if (state.poInjectCount >= 3 && tier !== "T0") {
  appendSignal(
    {
      kind: "friction",
      riskTier: tier,
      pathClass: state.pathClass ?? "unknown",
      plannedLanes: state.plannedLanes ?? [],
      source: { plane: "runtime", artifact: "before-submit-prompt" },
      hypothesis: "repeated PO checkpoint inject — verify brief/plan path is filled",
      detail: { poInjectCount: state.poInjectCount },
    },
    { state, dedupeKey: `friction:po:${state.pathClass ?? "unknown"}`, warnOnly: true },
  );
}
saveLaneState(state);

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
  if (state.suggestedSkills?.length) {
    lines.push(`suggestedSkills (pathTriggers): ${state.suggestedSkills.join(", ")}`);
  }

  const collabConfig = loadCollaborationConfig();
  if (collabConfig.enabled && tier !== "T0") {
    const phase = state.collaborationPhase ?? "proposal";
    lines.push(
      `Collaboration plane (Harness HITL): phase=${phase} mode=${oversightModeForPhase(phase)} — template: specs/templates/collaboration-plan.md`,
    );
    if (!state.revalidationConfirmed) {
      lines.push("Advisory: complete phases 1–5 (human decision + revalidation) before specialized @ skills");
    }
    const earlySkills = promptReferencesSpecializedSkill(prompt, collabConfig);
    if (earlySkills.length && !canLoadSpecializedSkills(state)) {
      lines.push(`Advisory: defer specialized skills until revalidation: ${earlySkills.join(", ")}`);
      appendSignal(
        {
          kind: "collaboration_gate",
          riskTier: tier,
          pathClass: state.pathClass ?? "unknown",
          plannedLanes: state.plannedLanes ?? [],
          source: { plane: "collaboration", artifact: "before-submit-prompt" },
          hypothesis: "specialized skill referenced before revalidationConfirmed",
          detail: { earlySkills, phase },
        },
        { state, dedupeKey: `collab:early-skill:${earlySkills.join(",")}`, warnOnly: true },
      );
    }
    if (isRevalidationExpired(state, collabConfig)) {
      onRevalidationTimeout(state);
      saveLaneState(state);
      lines.push(
        `Collaboration timeout (${collabConfig.timeoutPolicy}): revalidation expired — specialized unlock denied (never auto-approved)`,
      );
      appendSignal(
        {
          kind: "collaboration_timeout",
          riskTier: tier,
          pathClass: state.pathClass ?? "unknown",
          source: { plane: "collaboration", artifact: "before-submit-prompt" },
          hypothesis: "revalidation deadline exceeded; deny specialized unlock",
          detail: { timeoutPolicy: collabConfig.timeoutPolicy },
        },
        { state, warnOnly: true },
      );
    }
  }

  recordSkillsLoaded(state, extractSkillIdsFromPrompt(prompt), { source: "before-submit-prompt" });
  if ((state.skillsLoaded?.length ?? 0) > 3) {
    appendSignal(
      {
        kind: "composition_miss",
        riskTier: tier,
        pathClass: state.pathClass ?? "unknown",
        plannedLanes: state.plannedLanes ?? [],
        source: { plane: "runtime", artifact: "before-submit-prompt" },
        hypothesis: "skillsLoaded exceeds maxSkillBodies (3)",
        detail: { skillsLoaded: state.skillsLoaded, count: state.skillsLoaded.length },
      },
      { state, dedupeKey: `composition:skills-cap:${state.pathClass ?? "unknown"}`, warnOnly: true },
    );
  }
} else {
  lines.push("step 1 chore N/A — verify diff is docs/copy only");
}

if (shouldRouterHintsShadow() || shouldRouterHintsEnforce()) {
  try {
    const manifest = loadManifest();
    const diffOut = execSync("git diff --name-only HEAD 2>/dev/null", {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    const files = diffOut.trim().split("\n").filter(Boolean);
    const hints = (manifest.adaptation?.skillRouterHints ?? []).filter((hint) => {
      if (hint.status === "rejected") return false;
      if (shouldRouterHintsEnforce() && hint.status !== "active" && hint.status !== "shadow") {
        return false;
      }
      return files.some((f) => matchPath(f, hint.pathPattern));
    });
    for (const hint of hints) {
      const prefer = hint.prefer?.join(", ") ?? "";
      const prefix = shouldRouterHintsEnforce() && hint.status === "active" ? "Required" : "Advisory";
      lines.push(`${prefix} router hint (${hint.id}): prefer @${prefer.replace(/, /g, ", @")}`);
    }
  } catch {
    /* optional */
  }
}

console.log(allow({ additional_context: lines.join("\n") }));
process.exit(0);

function extractSkillIdsFromPrompt(text) {
  const ids = [];
  const re = /@([a-z0-9][a-z0-9-]*)/gi;
  let m;
  while ((m = re.exec(text ?? "")) !== null) {
    ids.push(m[1].toLowerCase());
  }
  return ids;
}
