import { describe, expect, it } from "vitest";
import {
  RELEASE_CHECKS,
  releaseTarget,
  validateReleaseGate,
  verifyReleaseGate,
} from "../scripts/release-gate.mjs";

const sha = "a".repeat(40);
const repository = "SafetyMP/HR-ERP";
const target = { repository, branch: "main", sha };
const run = {
  id: 12,
  name: "Main validation and demo",
  path: ".github/workflows/deploy.yml",
  event: "push",
  head_branch: "main",
  head_sha: sha,
  head_repository: { full_name: repository },
  status: "completed",
  conclusion: "success",
};
const jobs = RELEASE_CHECKS.map((name: string) => ({
  name,
  head_sha: sha,
  status: "completed",
  conclusion: "success",
}));

describe("protected branch release gate", () => {
  it("binds workflow_run to the upstream tested SHA rather than the default branch SHA", () => {
    expect(
      releaseTarget(
        "workflow_run",
        { workflow_run: run },
        repository,
        "refs/heads/main",
        "b".repeat(40),
      ),
    ).toEqual(target);
  });

  it.each([
    { ...run, event: "pull_request" },
    { ...run, conclusion: "failure" },
    { ...run, head_repository: { full_name: "fork/HR-ERP" } },
    { ...run, name: "Quality gate" },
    { ...run, head_branch: "feature" },
  ])("rejects untrusted or unsuccessful upstream execution", (untrusted) => {
    expect(() =>
      releaseTarget(
        "workflow_run",
        { workflow_run: untrusted },
        repository,
        "",
        "",
      ),
    ).toThrow();
  });

  it("allows a protected-branch manual target but rejects feature branches and tag refs", () => {
    expect(
      releaseTarget(
        "workflow_dispatch",
        {},
        repository,
        "refs/heads/main",
        sha,
      ),
    ).toEqual(target);
    for (const ref of ["refs/heads/feature", "refs/tags/v1.0.0"]) {
      expect(() =>
        releaseTarget("workflow_dispatch", {}, repository, ref, sha),
      ).toThrow();
    }
  });

  it("requires all six successful jobs on the current exact SHA", () => {
    expect(() => validateReleaseGate(target, sha, run, jobs)).not.toThrow();
    expect(() =>
      validateReleaseGate(target, "b".repeat(40), run, jobs),
    ).toThrow(/no longer/);
    expect(() => validateReleaseGate(target, sha, run, jobs.slice(1))).toThrow(
      /check did not pass/,
    );
    for (const conclusion of ["failure", "skipped", "cancelled", "neutral"]) {
      expect(() =>
        validateReleaseGate(target, sha, run, [
          { ...jobs[0], conclusion },
          ...jobs.slice(1),
        ]),
      ).toThrow(/check did not pass/);
    }
    expect(() =>
      validateReleaseGate(target, sha, run, [
        { ...jobs[0], head_sha: "b".repeat(40) },
        ...jobs.slice(1),
      ]),
    ).toThrow(/check did not pass/);
  });

  it("rejects a successful lookalike workflow or still-running rerun", () => {
    expect(() =>
      validateReleaseGate(
        target,
        sha,
        { ...run, path: ".github/workflows/other.yml" },
        jobs,
      ),
    ).toThrow();
    expect(() =>
      validateReleaseGate(target, sha, { ...run, status: "in_progress" }, jobs),
    ).toThrow();
  });

  it("does not let an earlier success hide a newer failed run", async () => {
    const get = async (path: string) => {
      if (path.startsWith("git/ref/")) return { object: { sha } };
      if (path.includes("/runs?"))
        return {
          workflow_runs: [run, { ...run, id: 13, conclusion: "failure" }],
        };
      expect(path).toContain("/13/jobs?");
      return { jobs, total_count: jobs.length };
    };
    await expect(verifyReleaseGate(target, get)).rejects.toThrow(
      /no successful/,
    );
  });

  it("reads every jobs page before checking the required gates", async () => {
    const get = async (path: string) => {
      if (path.startsWith("git/ref/")) return { object: { sha } };
      if (path.includes("/runs?")) return { workflow_runs: [run] };
      return {
        jobs: path.endsWith("page=1") ? jobs.slice(0, 3) : jobs.slice(3),
        total_count: 6,
      };
    };
    await expect(verifyReleaseGate(target, get)).resolves.toEqual(run);
  });
});
