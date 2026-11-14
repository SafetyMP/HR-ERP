/** Validate the exact protected-branch commit before granting release writes. */
export const RELEASE_CHECKS = [
  "ci / web",
  "ci / python-pipelines",
  "qa / vitest-shard (1)",
  "qa / vitest-shard (2)",
  "qa / integration",
  "qa / e2e",
];

/** Consume only the explicitly passed workflow identity, never the full event file. */
export function releaseTargetFromEnvironment(env) {
  return releaseTarget(
    env.GITHUB_EVENT_NAME,
    {
      workflow_run: {
        event: env.UPSTREAM_EVENT,
        conclusion: env.UPSTREAM_CONCLUSION,
        head_repository: { full_name: env.UPSTREAM_REPOSITORY },
        name: env.UPSTREAM_NAME,
        head_branch: env.UPSTREAM_BRANCH,
        head_sha: env.UPSTREAM_SHA,
      },
    },
    env.GITHUB_REPOSITORY,
    env.GITHUB_REF,
    env.GITHUB_SHA,
  );
}

export function releaseTarget(eventName, event, repository, ref, sha) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? "")) {
    throw new Error("Missing or invalid release repository");
  }
  let branch;
  let commit;
  if (eventName === "workflow_run") {
    const run = event.workflow_run;
    if (
      run?.event !== "push" ||
      run?.conclusion !== "success" ||
      run?.head_repository?.full_name !== repository ||
      run?.name !== "Main validation and demo"
    ) {
      throw new Error(
        "Release requires a successful same-repository production gate push",
      );
    }
    branch = run.head_branch;
    commit = run.head_sha;
  } else if (eventName === "workflow_dispatch") {
    branch = ref?.replace(/^refs\/heads\//, "");
    commit = sha;
  } else {
    throw new Error("Unsupported release event");
  }
  if (
    !["main", "master"].includes(branch) ||
    !/^[a-f0-9]{40}$/.test(commit ?? "")
  ) {
    throw new Error("Release requires an exact main/master commit");
  }
  return { repository, branch, sha: commit };
}

export function validateReleaseGate(target, remoteHead, run, jobs) {
  if (remoteHead !== target.sha) {
    throw new Error("Release commit is no longer the protected branch head");
  }
  if (
    run?.event !== "push" ||
    run?.head_sha !== target.sha ||
    run?.head_branch !== target.branch ||
    run?.head_repository?.full_name !== target.repository ||
    run?.path !== ".github/workflows/deploy.yml" ||
    run?.status !== "completed" ||
    run?.conclusion !== "success"
  ) {
    throw new Error(
      "Exact commit has no successful trusted production gate run",
    );
  }
  for (const name of RELEASE_CHECKS) {
    const matches = jobs.filter((job) => job.name === name);
    if (
      matches.length !== 1 ||
      matches[0].head_sha !== target.sha ||
      matches[0].status !== "completed" ||
      matches[0].conclusion !== "success"
    ) {
      throw new Error(`Release check did not pass: ${name}`);
    }
  }
}

export function githubClient(token, repository, fetchImpl = fetch) {
  if (!token) throw new Error("GITHUB_TOKEN is required");
  if (
    typeof repository !== "string" ||
    /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.exec(
      repository ?? "",
    )?.[0] !== repository ||
    [".", ".."].includes(repository.split("/")[1])
  ) {
    throw new Error("Invalid GitHub release repository");
  }
  // Only these read endpoints are needed by the release and container validators.
  const paths = [
    /^git\/ref\/heads\/(main|master)$/,
    /^actions\/workflows\/deploy\.yml\/runs\?head_sha=[a-f0-9]{40}&event=push&per_page=100$/,
    /^actions\/runs\/[1-9][0-9]*\/jobs\?filter=latest&per_page=100&page=[1-9][0-9]*$/,
    /^releases\/tags\/v[0-9]+\.[0-9]+\.[0-9]+$/,
    /^commits\/v[0-9]+\.[0-9]+\.[0-9]+$/,
    /^releases\/latest$/,
  ];
  return async (path) => {
    if (
      typeof path !== "string" ||
      !paths.some((pattern) => pattern.exec(path)?.[0] === path)
    ) {
      throw new Error("Unsupported GitHub release endpoint");
    }
    const response = await fetchImpl(
      `https://api.github.com/repos/${repository}/${path}`,
      {
        redirect: "error",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );
    if (!response.ok)
      throw new Error(`GitHub release gate HTTP ${response.status}`);
    return response.json();
  };
}

export async function verifyReleaseGate(target, get) {
  const head = await get(`git/ref/heads/${target.branch}`);
  const runs = await get(
    `actions/workflows/deploy.yml/runs?head_sha=${target.sha}&event=push&per_page=100`,
  );
  // The newest attempt/run governs; an earlier success cannot override a newer failure.
  const run = [...(runs.workflow_runs ?? [])]
    .filter((entry) => entry.head_branch === target.branch)
    .sort((a, b) => b.id - a.id)[0];
  const jobs = [];
  if (run) {
    for (let page = 1; ; page += 1) {
      const result = await get(
        `actions/runs/${run.id}/jobs?filter=latest&per_page=100&page=${page}`,
      );
      jobs.push(...result.jobs);
      if (jobs.length >= result.total_count) break;
      if (!result.jobs.length) throw new Error("Incomplete release gate jobs");
    }
  }
  validateReleaseGate(target, head.object?.sha, run, jobs);
  return run;
}
