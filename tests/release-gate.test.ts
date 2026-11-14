import { describe, expect, it, vi } from "vitest";
import {
  RELEASE_CHECKS,
  githubClient,
  releaseTarget,
  releaseTargetFromEnvironment,
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
  it("accepts only explicit upstream identity fields and retains their trust checks", () => {
    const env = {
      GITHUB_EVENT_NAME: "workflow_run",
      GITHUB_REPOSITORY: repository,
      GITHUB_REF: "refs/heads/main",
      GITHUB_SHA: "b".repeat(40),
      UPSTREAM_EVENT: "push",
      UPSTREAM_CONCLUSION: "success",
      UPSTREAM_REPOSITORY: repository,
      UPSTREAM_NAME: "Main validation and demo",
      UPSTREAM_BRANCH: "main",
      UPSTREAM_SHA: sha,
      GITHUB_EVENT_PATH: "/must/not/be/read",
    };
    expect(releaseTargetFromEnvironment(env)).toEqual(target);
    expect(() =>
      releaseTargetFromEnvironment({
        ...env,
        UPSTREAM_REPOSITORY: "fork/HR-ERP",
      }),
    ).toThrow();
    expect(() =>
      releaseTargetFromEnvironment({ ...env, UPSTREAM_SHA: "" }),
    ).toThrow();
    expect(() =>
      releaseTargetFromEnvironment({ ...env, UPSTREAM_EVENT: "pull_request" }),
    ).toThrow();
  });

  it("allows only fixed GitHub read endpoints and refuses redirects", async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const get = githubClient("test-token", repository, fetchImpl);
    await expect(
      get(
        `actions/workflows/deploy.yml/runs?head_sha=${sha}&event=push&per_page=100`,
      ),
    ).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.github.com/repos/${repository}/actions/workflows/deploy.yml/runs?head_sha=${sha}&event=push&per_page=100`,
      expect.objectContaining({ redirect: "error" }),
    );
    fetchImpl.mockClear();
    for (const path of [
      "https://attacker.invalid/",
      "//attacker.invalid/",
      "../../user",
      "releases/latest#fragment",
      "releases/latest\n",
      `actions/workflows/deploy.yml/runs?head_sha=${sha}&event=push&per_page=100&extra=secret`,
      "git/ref/heads/main/../../secrets",
      "actions/runs/12%2f..%2f/jobs?filter=latest&per_page=100&page=1",
    ]) {
      await expect(get(path)).rejects.toThrow(/Unsupported/);
    }
    expect(fetchImpl).not.toHaveBeenCalled();
    for (const repo of [
      "owner/..",
      "owner/.",
      "owner/repo\n",
      "owner/repo?secret=x",
      "owner/repo/extra",
    ]) {
      expect(() => githubClient("test-token", repo, fetchImpl)).toThrow(
        /repository/,
      );
    }
  });

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
