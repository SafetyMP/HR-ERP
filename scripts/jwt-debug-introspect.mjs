#!/usr/bin/env node
/**
 * Diagnostic helper — calls the temporary `/api/v1/_debug/jwt-introspect` route
 * to capture the **runtime** `JWT_SECRET` SHA-256 (as the deployed serverless
 * function actually reads it) and the **exact `jose` error class** when
 * verifyHrJwt fails. Replaces five rounds of bundler-evasion guessing with one
 * round-trip of real data.
 *
 * Usage:
 *   JWT_DEBUG_TOKEN=<same value as Vercel + GitHub production env> \
 *     npm run jwt:debug:introspect
 *
 * Optional env:
 *   VERCEL_JWT_VERCEL_ENV=production|preview   (default: production — must
 *     match the deployment `vercel curl` targets; mismatch is the most common
 *     false positive)
 *   VERCEL_JWT_SMOKE_DEPLOYMENT=<url|id>       (pin a specific deployment)
 *
 * Cleanup: delete this script and `src/app/api/v1/_debug/jwt-introspect/`
 * after the smoke goes green; remove `JWT_DEBUG_TOKEN` from Vercel + GitHub.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const shell = process.platform === "win32";
const vercelEnv = (process.env.VERCEL_JWT_VERCEL_ENV || "production").trim();
const debugToken = (process.env.JWT_DEBUG_TOKEN || "").trim();
const apiPath = "/api/v1/_debug/jwt-introspect";

if (debugToken.length < 16) {
  console.error(
    "JWT_DEBUG_TOKEN is not set (or shorter than 16 chars). Generate with `openssl rand -hex 16`, set it in BOTH Vercel dashboard Production env AND GitHub production environment secret, redeploy, then export it locally before running this script.",
  );
  process.exit(1);
}

function runVercel(args, opts = {}) {
  return spawnSync(
    "npx",
    ["--yes", "vercel@latest", ...args],
    {
      cwd: root,
      encoding: "utf-8",
      shell,
      env: process.env,
      maxBuffer: 12 * 1024 * 1024,
      ...opts,
    },
  );
}

function pickJwt(stdout) {
  const candidates = stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.split(".").length === 3);
  return candidates.length ? candidates[candidates.length - 1] : "";
}

function pickHex64(stdout) {
  const matches = stdout.match(/[a-f0-9]{64}/g) || [];
  return matches.length ? matches[matches.length - 1] : "";
}

console.error(
  `[introspect] mint-side SHA256 of JWT_SECRET via 'vercel env run -e ${vercelEnv}' …`,
);
const hashRun = runVercel([
  "env",
  "run",
  "-e",
  vercelEnv,
  "--",
  "node",
  "-e",
  "console.log(require('node:crypto').createHash('sha256').update((process.env.JWT_SECRET||'').trim()).digest('hex'))",
]);
if (hashRun.status !== 0) {
  console.error(hashRun.stderr || hashRun.stdout || "vercel env run (hash) failed");
  process.exit(hashRun.status ?? 1);
}
const mintSha = pickHex64(hashRun.stdout);

console.error(
  `[introspect] minting JWT via 'vercel env run -e ${vercelEnv} -- node scripts/issue-dev-jwt.mjs' …`,
);
const mintRun = runVercel([
  "env",
  "run",
  "-e",
  vercelEnv,
  "--",
  "node",
  "scripts/issue-dev-jwt.mjs",
]);
if (mintRun.status !== 0) {
  console.error(mintRun.stderr || mintRun.stdout || "vercel env run (mint) failed");
  process.exit(mintRun.status ?? 1);
}
const token = pickJwt(mintRun.stdout);
if (!token) {
  console.error("Could not parse JWT from mint stdout.");
  process.exit(1);
}

const deployment = process.env.VERCEL_JWT_SMOKE_DEPLOYMENT?.trim();
console.error(
  `[introspect] POST ${apiPath} via 'vercel curl'${deployment ? ` --deployment ${deployment}` : ""} …`,
);
const curl = runVercel(
  [
    "curl",
    apiPath,
    "-y",
    ...(deployment ? ["--deployment", deployment] : []),
    "--",
    "--silent",
    "--show-error",
    "--write-out",
    "\\nhttp_code:%{http_code}\\n",
    "-X",
    "POST",
    "--header",
    `x-debug-token: ${debugToken}`,
    "--header",
    `Authorization: Bearer ${token}`,
  ],
);

const out = curl.stdout || "";
if (curl.stderr) process.stderr.write(curl.stderr);

const httpMatch = out.match(/http_code:(\d{3})/);
const httpCode = httpMatch ? httpMatch[1] : "???";
const body = out.replace(/\nhttp_code:\d{3}\n?$/, "").trim();

let parsed = null;
if (body) {
  try {
    parsed = JSON.parse(body);
  } catch {
    /* Non-JSON body — keep raw for display. */
  }
}

console.log("\n=== JWT introspection ===");
console.log(`http_code               : ${httpCode}`);
if (httpCode === "404") {
  console.log(
    "result                  : route returned 404. Either JWT_DEBUG_TOKEN is unset on the deployment, or the local JWT_DEBUG_TOKEN does not match the runtime value. Set both, redeploy if you just added it, retry.",
  );
  process.exit(2);
}

const runtime = parsed?.runtime ?? null;
const verify = parsed?.verify ?? null;
const runtimeSha = runtime?.jwt_secret?.sha256 ?? null;
const runtimeLen = runtime?.jwt_secret?.length ?? null;
const runtimeMask = runtime?.jwt_secret?.mask ?? null;

console.log(`vercel_env              : ${runtime?.vercel_env ?? "?"}`);
console.log(`vercel_region           : ${runtime?.vercel_region ?? "?"}`);
console.log(`vercel_deployment_id    : ${runtime?.vercel_deployment_id ?? "?"}`);
console.log(`vercel_url              : ${runtime?.vercel_url ?? "?"}`);
console.log(`node_version            : ${runtime?.node_version ?? "?"}`);

console.log("\n--- JWT_SECRET comparison ---");
console.log(`mint-side  sha256       : ${mintSha || "?"}`);
console.log(`runtime    sha256       : ${runtimeSha || "?"}`);
console.log(`runtime    length       : ${runtimeLen ?? "?"}`);
console.log(`runtime    mask         : ${runtimeMask ?? "?"}`);
const shasMatch = mintSha && runtimeSha && mintSha === runtimeSha;
console.log(`secrets match           : ${shasMatch ? "YES" : "NO"}`);

console.log("\n--- verifyHrJwt result on the deployed function ---");
if (verify?.ok) {
  console.log(`ok                      : true`);
  console.log(`sub                     : ${verify.sub ?? "?"}`);
  console.log(`tenant_id               : ${verify.tenant_id ?? "?"}`);
  console.log(`exp                     : ${verify.exp ?? "?"} (iat ${verify.iat ?? "?"})`);
} else {
  console.log(`ok                      : false`);
  console.log(`reason                  : ${verify?.reason ?? "—"}`);
  console.log(`jose_error_name         : ${verify?.jose_error_name ?? "?"}`);
  console.log(`jose_error_code         : ${verify?.jose_error_code ?? "?"}`);
  console.log(`jose_error_message      : ${verify?.jose_error_message ?? "?"}`);
}

console.log("\n--- Decision (per plan) ---");
if (verify?.ok) {
  console.log(
    "Branch G — verify already passes. Run `npm run vercel:jwt:smoke` to confirm the user-facing route. If smoke also passes, proceed to Phase 4 cleanup.",
  );
} else if (!shasMatch) {
  console.log(
    "Branch A — JWT_SECRET drift between mint env (Vercel `vercel env run` Production) and runtime (deployed serverless). Rotate JWT_SECRET in BOTH Vercel dashboard Production AND GitHub `production` environment to a fresh `openssl rand -hex 32`, push an empty commit to redeploy, then re-run.",
  );
} else if (verify?.jose_error_name === "JWSSignatureVerificationFailed") {
  console.log(
    "Branch B — secrets match by SHA but jose still rejects the signature. Likely bundler-inlined a third value somewhere upstream of `requireJwtSecret`. Inspect `.vercel/output/functions/**` after `vercel build --prod` for any baked secret. Switch to `globalThis.process.env['JWT_SECRET']` in lib/security/jwt.ts.",
  );
} else if (verify?.jose_error_name === "JWTExpired") {
  console.log(
    "Branch C — token expired before reaching the function. Either clock skew (add `clockTolerance: 30` in lib/security/jwt.ts jwtVerify options) or the test took longer than `expiresIn`.",
  );
} else if (verify?.jose_error_name === "JWTClaimValidationFailed") {
  console.log(
    "Branch D — claim mismatch (likely iss/aud added to verify path but not mint path). Align lib/security/jwt.ts.",
  );
} else {
  console.log(
    `Unexpected jose error class (${verify?.jose_error_name ?? "?"}). Inspect the message above and the corresponding jose source before patching.`,
  );
}
