/**
 * Counsel-before-builder fallback when preToolUse Task hook is inert.
 * Enforced via beforeSubmitPrompt (fires reliably in IDE).
 */
import { tierAtLeast, rolloutDateReached } from "./lib.mjs";
import { criticalLanesForTier } from "./lane-state.mjs";

const BUILDER_INTENT =
  /\b(builder|implement|fix|edit|refactor|migrate|add feature|build out|wire up)\b/i;

export function detectBuilderIntent(prompt) {
  return BUILDER_INTENT.test(prompt ?? "");
}

export function laneSatisfied(state, lane) {
  const started = new Set((state.started ?? []).map((s) => s.function));
  const completed = new Set((state.completed ?? []).map((c) => c.function));
  return started.has(lane) || completed.has(lane);
}

export function counselSatisfied(state) {
  return laneSatisfied(state, "counsel");
}

/**
 * @param {{ tier: string, state: object, prompt: string, hookMode: string, preToolUseActive?: boolean }}
 * @returns {{ action: "allow" } | { action: "deny", message: string } | { action: "note", message: string }}
 */
export function evaluateCounselFallback({ tier, state, prompt, hookMode, preToolUseActive = false }) {
  if (!tierAtLeast(tier, "T3")) return { action: "allow" };
  if (!detectBuilderIntent(prompt)) return { action: "allow" };
  if (counselSatisfied(state)) return { action: "allow" };

  const message =
    "T3: run readonly counsel Task before implementation. Plan: npm run governance:plan · /multitask with function: counsel";

  const shadow =
    process.env.GOVERNANCE_COUNSEL_FALLBACK === "shadow" || hookMode !== "enforce";

  if (preToolUseActive && rolloutDateReached("preToolUseDenyT3From")) {
    return { action: "allow" };
  }

  if (shadow) {
    return { action: "note", message: `[counsel-fallback-shadow] ${message}` };
  }

  return { action: "deny", message };
}

export function missingCriticalLanes(state, tier) {
  const critical = criticalLanesForTier(tier);
  return critical.filter((l) => !laneSatisfied(state, l));
}
