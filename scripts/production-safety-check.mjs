#!/usr/bin/env node
/**
 * CI: fail when production-unsafe public env patterns are committed.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const issues = [];

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

// Credential leakage patterns in tracked docs / examples (not .env — gitignored).
const credentialPatterns = [
  {
    re: /postgresql:\/\/[^:]+:[^@]+@[^.]+\.neon\.tech/i,
    msg: "Neon DSN with embedded password",
  },
  {
    re: /JWT_SECRET\s*=\s*["']?[a-f0-9]{48,}/i,
    msg: "Likely real JWT_SECRET hex material",
  },
];

for (const rel of [".env.example", "README.md", "docs/operations/vercel-managed-phase1-environment.md"]) {
  const p = join(root, rel);
  if (!existsSync(p)) continue;
  const text = readFileSync(p, "utf8");
  for (const { re, msg } of credentialPatterns) {
    if (re.test(text)) {
      issues.push(`${rel}: ${msg}`);
    }
  }
}

// Docker / committed break-glass must not be on by default in the image.
const dockerfile = join(root, "Dockerfile");
if (existsSync(dockerfile)) {
  const text = readFileSync(dockerfile, "utf8");
  const active = text
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      return t && !t.startsWith("#");
    })
    .join("\n");
  if (/ALLOW_HS256_IN_PRODUCTION\s*=\s*1/.test(active)) {
    issues.push(
      "Dockerfile sets ALLOW_HS256_IN_PRODUCTION=1 — must not be baked into the image; inject break-glass only at deploy time",
    );
  }
}

for (const msg of issues) console.error(`ERROR: ${msg}`);
process.exit(issues.length ? 1 : 0);
