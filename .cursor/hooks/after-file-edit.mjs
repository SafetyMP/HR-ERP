#!/usr/bin/env node
import { readHookInput, allow, logHook } from "./lib.mjs";

const input = readHookInput();
const filePath = input.file_path ?? input.path ?? "";

logHook("afterFileEdit", { file_path: filePath });

const tsExtensions = /\.(ts|tsx|js|jsx|mjs)$/;
if (filePath && tsExtensions.test(filePath) && !filePath.includes("node_modules")) {
  console.log(
    allow({
      agent_message: `After editing ${filePath}, run targeted validation: npm run lint (or npx eslint ${filePath}).`,
    }),
  );
} else {
  console.log(allow());
}
process.exit(0);
