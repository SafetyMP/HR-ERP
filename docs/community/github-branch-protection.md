# GitHub branch protection & rulesets — maintainer playbook

Audience: **maintainers / org admins**. GitHub Rules are not fully representable as committed files—these checks must be mirrored in **`Settings → Rules → Rulesets`** or **classic Branch protection**.

## Goals

| Goal                                   | Enforcement surface                                                                                                                                                                                |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No direct merges with failing CI gates | Ruleset / branch protection requiring **Quality gate** + child jobs                                                                                                                                |
| Coordinated SaaS rollout               | **`production`** GitHub Environment (required reviewers ≈ QA lead + SecOps) — see **[`docs/operations/vercel-managed-phase1-environment.md`](../operations/vercel-managed-phase1-environment.md)** |
| Domain-aware review                    | [.github/CODEOWNERS](../../.github/CODEOWNERS) (**create `SafetyMP` teams first**)                                                                                                                 |
| Auto-review routing parity             | Toggle **Require review from CODEOWNERS** when teams exist                                                                                                                                         |

> **Agents vs GitHub statuses:** QA Chaos / SecOps / Janitor personas are Cursor workflow roles. Map them operationally via **mandatory reviewers on the Environment** + **explicit required status checks**, not hypothetical GitHub usernames—keep check names synced with [.github/workflows/quality-gate.yml](../../.github/workflows/quality-gate.yml).

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

Triggered only on **`push`** to `main/master` per [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml)—it reruns reusables so **shipping does not regress** versus PR validation. Decide policy:

| Policy            | Recommendation                                                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Minimal           | Leave deploy uncoupled from merge rules (**default for many repos**) — merges still required PR-green before merge.                                                          |
| Belt & suspenders | Also require **`Deploy production / ci`**, **`.../qa`**, and **`promote-production`** when your org mandates head-of-branch deploy visibility. Adds latency & reviewer load. |

**Environment:** `production` must list **deployment approvers**. Their human review substitutes for “merge-time SecOps”—CI already runs `npm run security:scan` twice (reusable CI + redeploy safeguard).

### From **`Publish container image`** & **`Release Please`**

Optional merges—do **not** block `main` on these scheduled automation workflows unless infra teams demand it.

### From **`OpenSSF Scorecard`**

After the first successful run on `main`, [`.github/workflows/scorecard.yml`](../../.github/workflows/scorecard.yml) exposes **`Scorecard analysis`** as an optional required check and populates the README badge at [scorecard.dev](https://scorecard.dev).

## CODEOWNERS pre-flight

Until [`SafetyMP` teams](../../.github/CODEOWNERS) exist, CODEOWNERS may **skip unknown owners silently**. Provision teams or temporarily replace `@SafetyMP/<team>` with concrete `@login` handles via hotfix PR.

## Dependabot

Require the same **`Quality gate`** green on Dependabot branches. Maintain **no blanket auto-merge** without label opt-in documented in **[`CONTRIBUTING.md`](../../CONTRIBUTING.md)** (`deps:automerge` pattern).
