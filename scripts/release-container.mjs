#!/usr/bin/env node
import { appendFileSync } from "node:fs";
import { githubClient } from "./release-gate.mjs";

const {
  RELEASE_TAG: tag,
  RELEASE_VERSION: version,
  RELEASE_SHA: sha,
} = process.env;
if (
  !/^\d+\.\d+\.\d+$/.test(version ?? "") ||
  tag !== `v${version}` ||
  !/^[a-f0-9]{40}$/.test(sha ?? "")
) {
  throw new Error(
    "Container requires a stable release version, matching tag, and exact SHA",
  );
}
const get = githubClient(process.env.GH_TOKEN, process.env.GITHUB_REPOSITORY);
const release = await get(`releases/tags/${tag}`);
if (release.draft || release.prerelease || release.tag_name !== tag) {
  throw new Error("Container tag is not a published stable GitHub Release");
}
const commit = await get(`commits/${tag}`);
if (commit.sha !== sha)
  throw new Error("Container commit differs from the released tag");
const latest = await get("releases/latest");
appendFileSync(
  process.env.GITHUB_OUTPUT,
  `latest=${latest.tag_name === tag}\n`,
);
console.log(
  `Verified ${tag} at ${sha}; source will be checked out by immutable SHA.`,
);
