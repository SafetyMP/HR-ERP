# Package releases and the GitHub Pages demo

The full application is a self-hosted source/container package. GitHub Pages is the maintained hosted demo at <https://safetymp.github.io/HR-ERP/>. Its leave-balance review and technical inspector use one synthetic employee request and six archived browser observations. The export runs entirely in the browser.

## Release sequence

1. Changes reach `main` through a pull request and the six required CI/QA checks. Branch protection and rulesets remain in force.
2. `Main validation and demo` repeats the six checks on the merged commit. Only then does it call the reusable Pages workflow to build and test `demo/out`, record the commit in `release.json`, and upload that exact directory.
3. The deploy job refuses an obsolete main commit, then publishes the uploaded artifact with GitHub's Pages actions. The hosted verification job checks `release.json` and runs the four browser scenarios against the deployed URL. A failed live check fails the workflow; inspect it before claiming delivery.
4. Semantic release follows successful main validation. It creates a tag and GitHub Release on the tested commit, using `GITHUB_TOKEN`. It does not create a version-bump commit, change branch protection, or need a bypass identity. Tags and release notes are the version authority; tracked package manifests remain unchanged.
5. The release workflow calls container publishing explicitly for the released commit. GitHub source archives and signed GHCR containers are the distribution packages. No npm registry publication is configured.

PR and manually dispatched demo runs validate artifacts only. Publication happens through the main workflow after CI/QA; no secret or write-capable deployment job runs for a PR. Manually re-run the main workflow's failed jobs to recover a failed deployment after diagnosing the failure. A semantic-release retry is allowed only when its exact current main commit has successful main validation.

## Pages configuration

The repository's Pages source is **GitHub Actions** (`build_type: workflow`). The `github-pages` environment allows deployment from `main`; it does not need a main-branch protection bypass. Keep the historical `gh-pages` branch as publication evidence; it is no longer the publishing source.

The reusable workflow builds assets under the repository path and takes the live browser target from the Pages deployment output, including its case-sensitive path. After the first Actions publication, source identity is public at `release.json` under the demo URL. Record both the Actions run and matching commit before reporting a release as live.

## Retired Vercel demo

`vercel.json` sets `git.deploymentEnabled` to `false`, disabling automatic Vercel Git builds. Vercel is no longer the demo release destination. Its project, credentials, backend resources, and previous deployments are preserved; this repository change does not take an already published Vercel URL offline. The older [Vercel operations notes](vercel-managed-phase1-environment.md) remain historical troubleshooting evidence for existing self-hosting users.

## Recovery and verification

Use a reviewed revert PR to restore application or demo code. Do not force-push main, weaken required checks, move an existing release tag, or replay an obsolete Pages artifact over a newer release. Inspect the failed workflow and re-run only the relevant failed jobs where possible. Container publishing can be retried for the immutable release tag without creating another release version.

After a change, verify the exact main SHA, all six CI/QA jobs, the Pages deployment and hosted browser checks, the release tag, and the container build/signature result. Compare the live `release.json` commit with main. Snapshot branch protection and rulesets before and after infrastructure repairs to establish that they did not change.
