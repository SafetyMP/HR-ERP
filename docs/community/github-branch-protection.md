# GitHub branch protection & rulesets — maintainer playbook

Audience: **maintainers / org admins**. GitHub Rules are not fully representable as committed files—these checks must be mirrored in **`Settings → Rules → Rulesets`** or **classic Branch protection**.

## Goals

| Goal                                   | Enforcement surface                                                                                                                                                                                |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No direct merges with failing CI gates | Ruleset / branch protection requiring **Quality gate** + child jobs                                                                                                                                |
| Coordinated SaaS rollout               | **Vercel git integration** deploys on push to `main`; treat Instant Rollback as the production abort path — see **[`docs/operations/vercel-managed-phase1-environment.md`](../operations/vercel-managed-phase1-environment.md)** |
| Domain-aware review                    | [.github/CODEOWNERS](../../.github/CODEOWNERS) (**create `SafetyMP` teams first**)                                                                                                                 |
| Auto-review routing parity             | Toggle **Require review from CODEOWNERS** when teams exist                                                                                                                                         |

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

### From **`Deploy production`** (post-merge continuity)

Triggered only on **`push`** to `main/master` per [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml)—it **re-validates** CI + QA only. It does **not** deploy; production shipping is **Vercel git integration** on the same push (and may start before Actions finishes).

| Policy            | Recommendation                                                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Minimal           | Leave deploy uncoupled from merge rules (**default**) — merges still require PR-green Quality gate before merge.                                                          |
| Belt & suspenders | Also watch **`Deploy production / ci`** and **`Deploy production / qa`** on `main` for head-of-branch visibility. There is no `promote-production` job. |

**Production abort:** use Vercel Instant Rollback when Actions fails after a bad push. Optional: configure Vercel to require a green GitHub check before promoting Production (org dashboard; not represented in this repo).

### From **`Publish container image`** & **`semantic-release`**

Optional — do **not** block `main` on GHCR publish or semantic-release unless infra teams demand it. Releases are driven by [`.github/workflows/semantic-release.yml`](../../.github/workflows/semantic-release.yml) → GitHub Release → [`.github/workflows/publish-ghcr.yml`](../../.github/workflows/publish-ghcr.yml).

#### Semantic release + “Require a pull request” (GH006)

`@semantic-release/git` pushes a `chore(release): … [skip ci]` commit (and tags) directly to `main`. With classic branch protection that **requires a pull request** (and especially with **`enforce_admins`**), the default Actions `GITHUB_TOKEN` is rejected:

```text
GH006: Protected branch update failed for refs/heads/main.
Changes must be made through a pull request.
```

Do **not** turn off PR requirements for all humans. Instead:

1. Create a **fine-grained PAT** (or GitHub App installation token) with **Contents: Read and write** on this repository. Store it as the repo Actions secret **`SEMANTIC_RELEASE_TOKEN`**.
2. Add that token’s actor (the user who owns the PAT, or the GitHub App) to a **bypass** for the “require pull request” rule on `main` (Rulesets → Bypass list, or classic protection allow-list / ruleset bypass). `enforce_admins` means even org owners cannot push without this bypass.
3. Re-run **Semantic release** via **Actions → Semantic release → Run workflow** (`workflow_dispatch`), or push any non-`[skip ci]` commit to `main`.

The workflow uses `secrets.SEMANTIC_RELEASE_TOKEN || secrets.GITHUB_TOKEN` for checkout and for `GITHUB_TOKEN` / `GH_TOKEN` passed to `npx semantic-release`. Without the secret **and** bypass, the job will keep failing at the git push step even though commit analysis succeeds.

### From **`OpenSSF Scorecard`**

After the first successful run on `main`, [`.github/workflows/scorecard.yml`](../../.github/workflows/scorecard.yml) exposes **`Scorecard analysis`** as an optional required check and populates the README badge at [scorecard.dev](https://scorecard.dev).

## Live org snapshot (audit)

As of the 2026-07-18 audit of `SafetyMP/HR-ERP`:

- Classic branch protection on `main` exists (`enforce_admins`, linear history, no force-push).
- **Required approving review count is 0**; CODEOWNERS reviews are **not** required.
- **Rulesets list is empty** — required status checks from Quality gate are **not** enforced via rulesets; confirm the classic protection “required checks” picker still lists Quality gate children.
- Prefer provisioning `@SafetyMP/*` teams or CODEOWNERS will silently skip unknown owners.

## CODEOWNERS pre-flight

Until [`SafetyMP` teams](../../.github/CODEOWNERS) exist, CODEOWNERS may **skip unknown owners silently**. Provision teams or temporarily replace `@SafetyMP/<team>` with concrete `@login` handles via hotfix PR.

## Dependabot

Require the same **`Quality gate`** green on Dependabot branches. Maintain **no blanket auto-merge** without label opt-in documented in **[`CONTRIBUTING.md`](../../CONTRIBUTING.md)** (`deps:automerge` pattern).
