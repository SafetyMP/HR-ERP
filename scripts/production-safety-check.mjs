#!/usr/bin/env node
/**
 * CI: fail when production-unsafe public env patterns are committed.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const root = process.cwd();
const issues = [];

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === ".next") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

const envFiles = [
  ".env.example",
  "docs/operations/vercel-managed-phase1-environment.md",
].filter((f) => existsSync(join(root, f)));

for (const rel of envFiles) {
  const text = readFileSync(join(root, rel), "utf8");
  const active = text
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .join("\n");
  if (/NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN\s*=\s*true/i.test(active)) {
    issues.push(
      `${rel} sets NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN=true — must not be enabled for production`,
    );
  }
  if (/NEXT_PUBLIC_DEMO_PREVIEW_SIGNIN\s*=\s*true/i.test(active)) {
    issues.push(
      `${rel} sets NEXT_PUBLIC_DEMO_PREVIEW_SIGNIN=true — must not be enabled for production`,
    );
  }
}

const signInCard = join(root, "src/components/auth/hr-sign-in-card.tsx");
if (existsSync(signInCard)) {
  const text = readFileSync(signInCard, "utf8");
  if (
    /ALLOW_DEMO_DEV_SIGNIN/.test(text) &&
    !/NODE_ENV\s*!==\s*["']production["']/.test(text)
  ) {
    issues.push(`${signInCard}: demo sign-in must be blocked in production builds`);
  }
}

if (process.env.CI === "true" && process.env.NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN === "true") {
  issues.push("CI build has NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN=true");
}

if (process.env.CI === "true" && process.env.NEXT_PUBLIC_DEMO_PREVIEW_SIGNIN === "true") {
  issues.push("CI build has NEXT_PUBLIC_DEMO_PREVIEW_SIGNIN=true");
}

for (const msg of issues) console.error(`ERROR: ${msg}`);
process.exit(issues.length ? 1 : 0);
