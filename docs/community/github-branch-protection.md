# GitHub branch protection & rulesets — maintainer playbook

Audience: **maintainers / org admins**. GitHub Rules are not fully representable as committed files—these checks must be mirrored in **`Settings → Rules → Rulesets`** or **classic Branch protection**.

## Goals

| Goal                                   | Enforcement surface                                                                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| No direct merges with failing CI gates | Ruleset / branch protection requiring **Quality gate** + child jobs                                                                 |
| Coordinated SaaS rollout               | **Main validation and demo** validates `main`, publishes the static GitHub Pages demo, then permits the versioned container release |
| Domain-aware review                    | [.github/CODEOWNERS](../../.github/CODEOWNERS) (**create `SafetyMP` teams first**)                                                  |
| Auto-review routing parity             | Toggle **Require review from CODEOWNERS** when teams exist                                                                          |

> **Agents vs GitHub statuses:** QA Chaos / SecOps / Janitor personas are Cursor workflow roles. Map them operationally via **mandatory reviewers** + **explicit required status checks**, not hypothetical GitHub usernames—keep check names synced with [.github/workflows/quality-gate.yml](../../.github/workflows/quality-gate.yml).

## Required status checks (`main`)

Select **these checks** via the picker after one clean run on `main` (exact labels depend on nesting order—match your Actions UI spelling):

### From **`Quality gate`**

Triggered on PRs (`pull_request`). Require **all**:

- **`ci`** (parent) **or**, if GitHub flattens the graph, select every child reusable job emitted by [.github/workflows/reusable-ci.yml](../../.github/workflows/reusable-ci.yml):

  | Job id             | Typical check label                     |
  | ------------------ | --------------------------------------- |
  | `web`              | `ci / web` or `Quality gate / ci / web` |
  | `python-pipelines` | analogous                               |

- **`qa`** (parent) — children from [.github/workflows/reusable-qa.yml](../../.github/workflows/reusable-qa.yml):

  | Job id         | Typical check labels       |
  | -------------- | -------------------------- |
  | `vitest-shard` | one row per shard (matrix) |
  | `integration`  | ...                        |
  | `e2e`          | ...                        |

If GitHub ever omits aggregated parents and only exposes leaf nodes, requiring **every leaf** achieves the stronger guarantee.

### From **`Main validation and demo`** (post-merge continuity)

[`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) runs the same CI + QA jobs on protected-branch pushes, then publishes the synthetic GitHub Pages demo. The Vercel demo is retired. The application remains a self-hostable package distributed as a versioned GHCR container; Pages is its interactive demo.

### Semantic release and the container package

[`.github/workflows/semantic-release.yml`](../../.github/workflows/semantic-release.yml) runs after a successful **Main validation and demo** push run from this repository. Manual dispatch is limited to `main`/`master` and must pass the same exact-commit gate.

The release validator requires the current protected branch head, the successful upstream run, and all six successful CI/QA jobs for that SHA. It rejects stale heads, failed or incomplete reruns, skipped checks, other workflows, fork runs, and pull request runs. Semantic-release attaches that tested commit to a local branch so its internal fetch cannot replace a detached checkout with newer code.

Releases use the short-lived repository **`GITHUB_TOKEN`**. The active configuration creates a Git tag and GitHub Release on the tested commit; it makes **no version-bump commit or remote branch update**. The tracked `package.json` version and historical `CHANGELOG.md` are not updated automatically. GitHub Releases and container version/revision labels identify published versions. This private application is not published to npm.

No release bypass actor, personal token, `SEMANTIC_RELEASE_TOKEN`, protection toggle, or force push is needed. Keep the PR requirement, required checks, linear history, and administrator enforcement unchanged. Do not reintroduce `@semantic-release/git` into the active release configuration.

A GitHub Release created with `GITHUB_TOKEN` does not trigger another `release: published` workflow. Therefore the release job calls [`.github/workflows/publish-ghcr.yml`](../../.github/workflows/publish-ghcr.yml) directly as a reusable workflow with its exact tag, version, and commit. The container workflow validates the published release/tag association before checking out that SHA, builds both Linux architectures, publishes version and current `latest` tags, and signs the digest. A historical package rebuild does not move `latest` unless its release is still GitHub's latest stable release.

To recover a failed container build after the tag/release was published, dispatch **Publish container image** with the existing release tag, version, and exact commit. Rerunning semantic-release without new releasable commits does not invent another version. Fix release failures through normal pull requests; never relax branch protection.

Sources: [GitHub token trigger behavior](https://docs.github.com/en/actions/concepts/security/github_token), [semantic-release guidance on release commits](https://semantic-release.org/support/faq/).

### From **`OpenSSF Scorecard`**

After the first successful run on `main`, [`.github/workflows/scorecard.yml`](../../.github/workflows/scorecard.yml) exposes **`Scorecard analysis`** as an optional required check and populates the README badge at [scorecard.dev](https://scorecard.dev).

## Live org snapshot (audit)

As of 2026-07-18 on `SafetyMP/HR-ERP` (owner is a **user** account, not an org):

- **Ruleset [`main-quality-gate`](https://github.com/SafetyMP/HR-ERP/rules/19149676)** — active on `main`/`master`:
  - Pull request: **required** (approving review count **0**, CODEOWNERS review **off** — authors cannot self-approve on a solo personal account)
  - Required checks: `ci / web`, `ci / python-pipelines`, `qa / vitest-shard (1)`, `qa / vitest-shard (2)`, `qa / integration`, `qa / e2e`
  - Bypass: user `@SafetyMP` only. GitHub Actions Integration bypass is **not** available on personal repos.
- Classic branch protection still has `enforce_admins` + linear history; classic require-PR stays off (ruleset owns the PR gate).
- [`.github/CODEOWNERS`](../../.github/CODEOWNERS) routes to `@SafetyMP` for routing/docs; require-CODEOWNERS stays off until an org or second reviewer exists.
- **Historical semantic-release setup:** the old pipeline required a bypass identity for release commits. The current pipeline above removes that requirement; it uses the default `GITHUB_TOKEN` only for tags/releases.
- Release **v2.14.0** / **v2.14.1** published; protection/docs apply PR [#103](https://github.com/SafetyMP/HR-ERP/pull/103) merged after solo-owner review policy relaxation.

Re-audit: `./scripts/github-protection-audit.sh` (expect exit 0).

## CODEOWNERS pre-flight

`SafetyMP` is a personal account — `@SafetyMP/hr-erp-*` teams cannot exist until the repo moves under an organization. Current CODEOWNERS uses `@SafetyMP`. When an org is created, restore team handles and keep require-CODEOWNERS on.

## Executable checklist (Track A1)

Apply in **Settings → Rules → Rulesets** (preferred) or classic branch protection on `main`. After one green PR, pick exact check labels from the UI.

### Ruleset target

- Branches: `main` (and `master` if used)
- Enforcement: **Active**
- Bypass: no additional release actor; the release workflow must not rely on a bypass

### Required status checks (exact Quality gate leaves)

From [`.github/workflows/quality-gate.yml`](../../.github/workflows/quality-gate.yml) → reusables:

| Check label (typical)   | Source                                                       |
| ----------------------- | ------------------------------------------------------------ |
| `ci / web`              | [`reusable-ci.yml`](../../.github/workflows/reusable-ci.yml) |
| `ci / python-pipelines` | same                                                         |
| `qa / vitest-shard (1)` | [`reusable-qa.yml`](../../.github/workflows/reusable-qa.yml) |
| `qa / vitest-shard (2)` | same                                                         |
| `qa / integration`      | same                                                         |
| `qa / e2e`              | same                                                         |

If the UI exposes parents `ci` / `qa` instead of leaves, require those parents **or** every leaf above.

### Reviews (solo personal account)

- [x] Ruleset **Pull request** gate on (changes must use a PR)
- [x] `required_approving_review_count` = **0** and **Require CODEOWNERS** = off — avoids author/CODEOWNER self-review deadlock on `@SafetyMP`
- [ ] When the repo moves under an org (or a second reviewer exists): set approving reviews **≥ 1** and turn **Require CODEOWNERS** back on
- [x] The existing ruleset owns the PR gate; preserve existing protection configuration. Releases no longer depend on its historical `@SafetyMP` bypass.

### Audit script (read-only)

```bash
chmod +x scripts/github-protection-audit.sh
./scripts/github-protection-audit.sh
```

Expect exit `0` when rulesets/reviews/checks match this checklist. Paste stdout into the evidence bundle when closing Track A. **Not** wired into PR Quality gate (org state is not a code property).

### CODEOWNERS preflight

If `@SafetyMP/hr-erp-*` teams are missing, either provision them under the org or temporarily map paths to concrete `@login` handles in a follow-up PR **before** enabling require-CODEOWNERS.

## Dependabot

Require the same **`Quality gate`** green on Dependabot branches. Maintain **no blanket auto-merge** without label opt-in documented in **[`CONTRIBUTING.md`](../../CONTRIBUTING.md)** (`deps:automerge` pattern).
