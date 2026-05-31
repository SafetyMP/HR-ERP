#!/usr/bin/env node
/**
 * governance-cloud-session — Runtime parity shim: emit ledger rows from CI when IDE hooks absent (ADR 0019)
 *
 * Usage:
 *   node governance-cloud-session.mjs emit --kind ci_fail --path-class cloud_ci --hypothesis "..."
 */
import { appendSignal, shouldEmitLearning } from "./governance-learning.mjs";

function parseArgs(argv) {
  const args = { kind: "ci_fail", pathClass: "cloud_ci", hypothesis: "", tier: "T2" };
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--kind") args.kind = argv[++i];
    else if (a === "--path-class") args.pathClass = argv[++i];
    else if (a === "--hypothesis") args.hypothesis = argv[++i];
    else if (a === "--tier") args.tier = argv[++i];
    else positional.push(a);
  }
  args.command = positional[0] ?? "emit";
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.command !== "emit") {
    console.error(`Unknown command: ${args.command}`);
    return 1;
  }
  if (!shouldEmitLearning()) {
    console.log("governance-cloud-session: learning emit disabled by rollout");
    return 0;
  }
  const signal = appendSignal({
    kind: args.kind,
    riskTier: args.tier,
    pathClass: args.pathClass,
    source: { plane: "evidence", artifact: "governance-cloud-session" },
    hypothesis: args.hypothesis || "Cloud/CI session without IDE hooks",
    detail: { ci: process.env.CI === "true", githubRunId: process.env.GITHUB_RUN_ID ?? null },
  });
  if (signal) console.log(`Emitted cloud session signal: ${signal.signal_id}`);
  else console.log("No signal emitted (dedupe or invalid)");
  return 0;
}

process.exit(await main());
