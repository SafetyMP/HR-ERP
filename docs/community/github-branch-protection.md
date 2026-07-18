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

Do **not** turn off PR requirements for all humans. Classic branch protection’s “Require a pull request” flag has **no bypass list** — even a PAT owned by an admin is rejected when **`enforce_admins`** is on. Use a **repository ruleset** instead:

1. **Ruleset on `main`:** rule type **Pull request** (approving review count may stay `0` if you only need the PR gate). Add a **Bypass** actor for the release identity — typically **GitHub Actions** (integration) so the workflow’s token can push `chore(release)` commits, and/or the user/App that owns `SEMANTIC_RELEASE_TOKEN`.
2. **Remove** the classic protection toggle **Require a pull request before merging** once the ruleset is active (otherwise classic still blocks every direct push, including bypassed ruleset actors).
3. Optional but recommended: create a **fine-grained PAT** (or GitHub App token) with **Contents: Read and write**, store as repo secret **`SEMANTIC_RELEASE_TOKEN`**, and include that actor on the ruleset bypass list. The workflow prefers this secret over `GITHUB_TOKEN` for checkout and for `GITHUB_TOKEN` / `GH_TOKEN` passed to `npx semantic-release`.
4. Re-run **Semantic release** via **Actions → Semantic release → Run workflow** (`workflow_dispatch`), or push any non-`[skip ci]` commit to `main`.

Without a ruleset bypass (and with classic require-PR removed or replaced), the job keeps failing at the git push step even though commit analysis succeeds.

### From **`OpenSSF Scorecard`**

After the first successful run on `main`, [`.github/workflows/scorecard.yml`](../../.github/workflows/scorecard.yml) exposes **`Scorecard analysis`** as an optional required check and populates the README badge at [scorecard.dev](https://scorecard.dev).

## Live org snapshot (audit)

As of 2026-07-18 on `SafetyMP/HR-ERP`:

- Classic branch protection on `main` exists (`enforce_admins`, linear history, no force-push).
- Classic **Require a pull request** was **removed** so `@semantic-release/git` can push release commits with `GITHUB_TOKEN` (GH006 otherwise). Prefer restoring the PR gate via a **ruleset** (see above) once a bypass actor is available — adding GitHub Actions as a ruleset Integration bypass failed with “must be part of the ruleset source or owner organization”; use **OrganizationAdmin** bypass plus admin-owned `SEMANTIC_RELEASE_TOKEN` as the alternative.
- CODEOWNERS reviews are **not** required.
- Required status checks from Quality gate are **not** enforced via rulesets; confirm the classic protection “required checks” picker still lists Quality gate children.
- Prefer provisioning `@SafetyMP/*` teams or CODEOWNERS will silently skip unknown owners.
- Release **v2.14.0** published after the workflow + protection fix ([#100](https://github.com/SafetyMP/HR-ERP/pull/100)).

## CODEOWNERS pre-flight

Until [`SafetyMP` teams](../../.github/CODEOWNERS) exist, CODEOWNERS may **skip unknown owners silently**. Provision teams or temporarily replace `@SafetyMP/<team>` with concrete `@login` handles via hotfix PR.

## Executable checklist (Track A1)

Apply in **Settings → Rules → Rulesets** (preferred) or classic branch protection on `main`. After one green PR, pick exact check labels from the UI.

### Ruleset target

- Branches: `main` (and `master` if used)
- Enforcement: **Active**
- Bypass: release actor only (`SEMANTIC_RELEASE_TOKEN` owner and/or OrganizationAdmin) — **not** all humans

### Required status checks (exact Quality gate leaves)

From [`.github/workflows/quality-gate.yml`](../../.github/workflows/quality-gate.yml) → reusables:

| Check label (typical) | Source |
| --- | --- |
| `ci / web` | [`reusable-ci.yml`](../../.github/workflows/reusable-ci.yml) |
| `ci / python-pipelines` | same |
| `qa / vitest-shard (1)` | [`reusable-qa.yml`](../../.github/workflows/reusable-qa.yml) |
| `qa / vitest-shard (2)` | same |
| `qa / integration` | same |
| `qa / e2e` | same |

If the UI exposes parents `ci` / `qa` instead of leaves, require those parents **or** every leaf above.

### Reviews

- [ ] `required_approving_review_count` **≥ 1**
- [ ] **Require review from CODEOWNERS** = on (only after teams in [`.github/CODEOWNERS`](../../.github/CODEOWNERS) exist — otherwise GitHub skips unknown owners)
- [ ] Do **not** re-enable classic “Require a pull request” without a ruleset bypass for semantic-release (see GH006 section)

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
