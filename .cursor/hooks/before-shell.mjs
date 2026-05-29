#!/usr/bin/env node
import { readHookInput, enforceOrLog, allow, logHook, isDestructiveShell } from "./lib.mjs";

const input = readHookInput();
const command = input.command ?? "";

if (!command) {
  console.log(allow());
  process.exit(0);
}

if (/(^|\s)(rm\s+-rf\s+\/|:\(\)\s*\{\s*:\|\:&\s*\};:)/.test(command)) {
  enforceOrLog(
    "destructive_shell",
    "Blocked: potentially destructive shell command.",
    `Command blocked by HR ERP governance hook: ${command}`,
  );
}

if (isDestructiveShell(command)) {
  enforceOrLog(
    "destructive_git_db",
    "Blocked: destructive git or database command.",
    `Use forward-only migrations and avoid force push. Blocked: ${command}`,
  );
}

logHook("beforeShellExecution", { command: command.slice(0, 200) });
console.log(allow());
process.exit(0);
