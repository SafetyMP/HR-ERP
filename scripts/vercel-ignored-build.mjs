#!/usr/bin/env node
/**
 * Vercel Ignored Build Step helper.
 *
 * Exit 0 → Vercel SKIPS the build.
 * Exit 1 → Vercel PROCEEDS with the build.
 *
 * Production: wait until required GitHub checks for the commit are success
 * (fail closed if token missing). Preview: proceed if token missing (dev velocity).
 *
 * Configure in Vercel → Project → Git → Ignored Build Step:
 *   node scripts/vercel-ignored-build.mjs
 */
import {
  decideIgnoredBuild,
  DEFAULT_REQUIRED_CHECK_NEEDLES,
  getOctokit,
} from "./lib/vercel-ignored-build-core.mjs";

const sha = (process.env.VERCEL_GIT_COMMIT_SHA ?? "").trim();
const token = (process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "").trim();
const vercelEnv = (process.env.VERCEL_ENV ?? "").trim().toLowerCase();
const isProduction = vercelEnv === "production";
const repo = (process.env.GITHUB_REPOSITORY ?? "").trim();

const needles = (process.env.VERCEL_REQUIRED_CHECKS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const requiredNeedles =
  needles.length > 0 ? needles : DEFAULT_REQUIRED_CHECK_NEEDLES;

const decision = await decideIgnoredBuild({
  sha,
  token,
  isProduction,
  repository: repo,
  requiredNeedles,
  fetchChecks: async ({ owner, name, commitSha, authToken }) => {
    const client = getOctokit(authToken);
    return client.listCheckRuns(owner, name, commitSha);
  },
});

if (decision.proceed) {
  console.log(`vercel-ignored-build: proceed — ${decision.reason}`);
  process.exit(1);
}

console.log(`vercel-ignored-build: skip — ${decision.reason}`);
process.exit(0);
