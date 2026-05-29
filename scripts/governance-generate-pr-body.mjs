#!/usr/bin/env node
/** Wrapper: emit PR body stub for hooks / CI autofill */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "main";

const r = spawnSync(
  process.execPath,
  [join(root, "scripts", "governance-lint.mjs"), "pr-body-generate", "--base", base],
  { encoding: "utf8", cwd: root },
);

if (r.stdout) process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);
process.exit(r.status ?? 1);
