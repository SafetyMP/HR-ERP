#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readHookInput, allow, logHook } from "./lib.mjs";

const input = readHookInput();
const prompt = input.prompt ?? input.text ?? "";

let tier = "T1";
try {
  const out = execSync("node scripts/governance-lint.mjs diff 2>/dev/null", {
    encoding: "utf8",
    cwd: process.cwd(),
  });
  const m = out.match(/Suggested riskTier:\s*(T\d)/);
  if (m) tier = m[1];
} catch {
  /* default T1 */
}

logHook("beforeSubmitPrompt", { tier, prompt_len: prompt.length });

if (tier !== "T0") {
  console.log(
    allow({
      additional_context: [
        `riskTier: ${tier}`,
        "PO orchestration checkpoint: fill Feature brief path | UAC count | gate Y/N | phase ADR: specs/alignment/decisions/0001-phase1-scope.md",
        "Native runtime: use /multitask for parallel lanes; node scripts/governance-lint.mjs plan --json for DAG",
      ].join("\n"),
    }),
  );
} else {
  console.log(allow({ additional_context: "step 1 chore N/A" }));
}
process.exit(0);
