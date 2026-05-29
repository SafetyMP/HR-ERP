#!/usr/bin/env node
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { readHookInput, allow, logHook } from "./lib.mjs";

const input = readHookInput();
const status = input.status ?? "completed";

logHook("stop", { status });

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

console.log(allow());
process.exit(0);
