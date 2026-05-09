#!/usr/bin/env node
/**
 * Mint a dev JWT with the same secret as a Vercel **environment**, then `vercel curl` that deployment.
 * Usage: node scripts/vercel-jwt-smoke.mjs [/api/v1/path...]
 *
 * Requires: `vercel link` against the target project. Does not print the raw JWT by default.
 *
 * Env:
 * - `VERCEL_JWT_VERCEL_ENV` — `production` (default), `preview`, or `development`. Must match
 *   wherever `vercel curl` sends traffic; minting with Production secret and curling Preview is the
 *   usual cause of repeated `invalid_token`.
 * - `VERCEL_JWT_SMOKE_DEPLOYMENT` — optional URL or deployment ID for `vercel curl --deployment`.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiPath = process.argv[2] || "/api/v1/me/paystub/current";
const shell = process.platform === "win32";
const vercelEnv = (process.env.VERCEL_JWT_VERCEL_ENV || "production").trim();

function pickJwt(stdout) {
  const candidates = stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.split(".").length === 3);
  return candidates.length ? candidates[candidates.length - 1] : "";
}

const mint = spawnSync(
  "npx",
  ["--yes", "vercel@latest", "env", "run", "-e", vercelEnv, "--", "node", "scripts/issue-dev-jwt.mjs"],
  {
    cwd: root,
    encoding: "utf-8",
    shell,
    env: process.env,
    maxBuffer: 12 * 1024 * 1024,
  },
);

if (mint.status !== 0) {
  console.error(
    mint.stderr ||
      mint.stdout ||
      `vercel env run -e ${vercelEnv} (mint) failed`,
  );
  process.exit(mint.status ?? 1);
}

const token = pickJwt(mint.stdout);
if (!token) {
  console.error(
    "Could not parse JWT from mint stdout. Run `npm run jwt:dev:vercel` or `vercel env run -e <env> -- node scripts/issue-dev-jwt.mjs` manually.",
  );
  process.exit(1);
}

const deployment = process.env.VERCEL_JWT_SMOKE_DEPLOYMENT?.trim();
const curlBin = [
  "--yes",
  "vercel@latest",
  "curl",
  apiPath,
  "-y",
  ...(deployment ? ["--deployment", deployment] : []),
  "--",
  "--silent",
  "--show-error",
  "--write-out",
  "\\nhttp_code:%{http_code}\\n",
  "--header",
  `Authorization: Bearer ${token}`,
];

const curl = spawnSync(
  "npx",
  curlBin,
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
