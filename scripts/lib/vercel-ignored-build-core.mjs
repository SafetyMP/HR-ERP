/**
 * Pure decision helpers for Vercel Ignored Build Step (unit-tested).
 */

export const DEFAULT_REQUIRED_CHECK_NEEDLES = [
  "ci / web",
  "python-pipelines",
  "vitest-shard",
  "integration",
  "e2e",
];

/**
 * @param {{
 *   sha: string,
 *   token: string,
 *   isProduction: boolean,
 *   repository: string,
 *   requiredNeedles: string[],
 *   fetchChecks: (args: {
 *     owner: string,
 *     name: string,
 *     commitSha: string,
 *     authToken: string,
 *   }) => Promise<Array<{ name: string, status: string, conclusion: string | null }>>,
 * }} input
 * @returns {Promise<{ proceed: boolean, reason: string }>}
 */
export async function decideIgnoredBuild(input) {
  const { sha, token, isProduction, repository, requiredNeedles, fetchChecks } =
    input;

  if (!sha) {
    return { proceed: !isProduction, reason: "missing VERCEL_GIT_COMMIT_SHA" };
  }

  if (!token) {
    if (isProduction) {
      return {
        proceed: false,
        reason: "production missing GITHUB_TOKEN/GH_TOKEN (fail closed)",
      };
    }
    return {
      proceed: true,
      reason: "preview missing token — proceed for velocity",
    };
  }

  const repo = repository.includes("/")
    ? repository
    : process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
      : "";

  if (!repo.includes("/")) {
    return {
      proceed: !isProduction,
      reason: "missing GITHUB_REPOSITORY / Vercel git repo identity",
    };
  }

  const [owner, name] = repo.split("/");
  let checks;
  try {
    checks = await fetchChecks({
      owner,
      name,
      commitSha: sha,
      authToken: token,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      proceed: false,
      reason: `check API error: ${msg}`,
    };
  }

  const completed = checks.filter((c) => c.status === "completed");
  const missing = [];
  const failed = [];

  for (const needle of requiredNeedles) {
    const matches = completed.filter((c) =>
      c.name.toLowerCase().includes(needle.toLowerCase()),
    );
    if (matches.length === 0) {
      // Still in progress or not reported yet → skip build (wait).
      const inFlight = checks.some(
        (c) =>
          c.name.toLowerCase().includes(needle.toLowerCase()) &&
          c.status !== "completed",
      );
      if (inFlight) {
        return {
          proceed: false,
          reason: `waiting for in-progress checks matching '${needle}'`,
        };
      }
      missing.push(needle);
      continue;
    }
    const allSuccess = matches.every((c) => c.conclusion === "success");
    if (!allSuccess) {
      failed.push(needle);
    }
  }

  if (failed.length > 0) {
    return {
      proceed: false,
      reason: `required checks failed: ${failed.join(", ")}`,
    };
  }
  if (missing.length > 0) {
    return {
      proceed: false,
      reason: `required checks not yet reported: ${missing.join(", ")}`,
    };
  }

  return {
    proceed: true,
    reason: "all required Quality gate checks succeeded",
  };
}

/**
 * Minimal check-runs client (no octokit dependency).
 * @param {string} token
 */
export function getOctokit(token) {
  return {
    /**
     * @param {string} owner
     * @param {string} name
     * @param {string} commitSha
     */
    async listCheckRuns(owner, name, commitSha) {
      const url = `https://api.github.com/repos/${owner}/${name}/commits/${commitSha}/check-runs?per_page=100`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "hr-erp-vercel-ignored-build",
        },
      });
      if (!res.ok) {
        throw new Error(`GitHub check-runs HTTP ${res.status}`);
      }
      const body = /** @type {{ check_runs?: Array<{ name: string, status: string, conclusion: string | null }> }} */ (
        await res.json()
      );
      return (body.check_runs ?? []).map((r) => ({
        name: r.name,
        status: r.status,
        conclusion: r.conclusion,
      }));
    },
  };
}
