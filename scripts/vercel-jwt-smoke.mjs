#!/usr/bin/env node
/**
 * Mint a Production-aligned dev JWT (`jwt:dev:vercel`) and call `vercel curl` with Bearer auth.
 * Usage: node scripts/vercel-jwt-smoke.mjs [/api/v1/path...]
 *
 * Requires: `vercel link` against the target project. Does not print the raw JWT by default.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiPath = process.argv[2] || "/api/v1/me/paystub/current";
const shell = process.platform === "win32";

function pickJwt(stdout) {
  const candidates = stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.split(".").length === 3);
  return candidates.length ? candidates[candidates.length - 1] : "";
}

const mint = spawnSync("npm", ["run", "jwt:dev:vercel"], {
  cwd: root,
  encoding: "utf-8",
  shell,
  env: process.env,
  maxBuffer: 12 * 1024 * 1024,
});

if (mint.status !== 0) {
  console.error(mint.stderr || mint.stdout || "jwt:dev:vercel failed");
  process.exit(mint.status ?? 1);
}

const token = pickJwt(mint.stdout);
if (!token) {
  console.error(
    "Could not parse JWT from jwt:dev:vercel stdout. Run `npm run jwt:dev:vercel` manually.",
  );
  process.exit(1);
}

const curl = spawnSync(
  "npx",
  ["--yes", "vercel@latest", "curl", apiPath, "-y", "--", "--silent", "--show-error", "--write-out", "\\nhttp_code:%{http_code}\\n", "--header", `Authorization: Bearer ${token}`],
  {
    cwd: root,
    encoding: "utf-8",
    shell,
    env: process.env,
    maxBuffer: 12 * 1024 * 1024,
  },
);

if (curl.stdout) process.stdout.write(curl.stdout);
if (curl.stderr) process.stderr.write(curl.stderr);
process.exit(curl.status ?? 1);
