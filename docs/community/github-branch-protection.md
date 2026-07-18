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
