#!/usr/bin/env node
import { appendFileSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import {
  releaseTarget,
  githubClient,
  verifyReleaseGate,
} from "./release-gate.mjs";

const env = process.env;
const target = releaseTarget(
  env.GITHUB_EVENT_NAME,
  JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, "utf8")),
  env.GITHUB_REPOSITORY,
  env.GITHUB_REF,
  env.GITHUB_SHA,
);
const get = githubClient(env.GITHUB_TOKEN, target.repository);
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
if (git("rev-parse", "HEAD") !== target.sha)
  throw new Error("Checkout differs from tested commit");
await verifyReleaseGate(target, get);
// A detached checkout lets semantic-release fetch replace the branch with newer code.
// Attach the tested commit locally; this never updates a remote branch.
git("switch", "-C", target.branch, target.sha);
const { default: semanticRelease } = await import("semantic-release");
const result = await semanticRelease(
  {},
  {
    env: {
      ...env,
      GITHUB_REF: `refs/heads/${target.branch}`,
      GITHUB_SHA: target.sha,
    },
  },
);
if (git("rev-parse", "HEAD") !== target.sha)
  throw new Error("Release unexpectedly changed HEAD");
if (result?.nextRelease) {
  const { gitTag, version, gitHead } = result.nextRelease;
  if (gitHead !== target.sha || git("rev-list", "-1", gitTag) !== target.sha) {
    throw new Error("Release tag does not identify the tested commit");
  }
  appendFileSync(
    env.GITHUB_OUTPUT,
    `published=true\ntag=${gitTag}\nversion=${version}\nsha=${target.sha}\n`,
  );
} else {
  appendFileSync(env.GITHUB_OUTPUT, "published=false\n");
}
