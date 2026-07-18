# Agent instructions — HR ERP

**Repository role:** Evergreen OSS **reference application** for multi-tenant HR SaaS with an **in-repo agent governance harness** (T0–T4 tiers, hooks, evidence). Not a certified payroll vendor — scope and demo boundaries: [docs/meta/evergreen-open-source-positioning.md](docs/meta/evergreen-open-source-positioning.md).

**Team roster:** [docs/meta/agent-team-map.md](docs/meta/agent-team-map.md) — lanes, skills, planes (load first).

This repository uses **Cursor 3 native runtime** + tier-gated skills. Start with [cursor-3-native-runtime.md](docs/meta/cursor-3-native-runtime.md); hooks in [`.cursor/hooks.json`](.cursor/hooks.json).

**Project skills (13):** [.cursor/skills/README.md](.cursor/skills/README.md) — canonical inventory; do not duplicate here.

**Global skills (lazy):** `~/.cursor/skills/README.md` · invoke `@skill-router` at T1+ per `~/.cursor/rules/core-dynamic-skills.mdc`.

**Team MCP (IDE plane):** [`.cursor/mcp.json`](.cursor/mcp.json) — context7, prisma. Product copilot MCP is separate (`lib/copilot/`).

**Always-on boundaries:** [`.cursor/rules/repo-boundaries.mdc`](.cursor/rules/repo-boundaries.mdc) + [docs/architecture/](docs/architecture/).

Before new capabilities, read:

- **[Stakeholder value plan](docs/product/stakeholder-value-plan.md)** — single active forward plan
- [HR Product Owner operating model](docs/product/hr-product-owner-operating-model.md)
- Feature briefs: [docs/product/feature-briefs/](docs/product/feature-briefs/) · [template](docs/product/feature-brief-template.md)
- Compliance: [docs/compliance/](docs/compliance/) — load `@hr-regulated-domain` (T3)
- Payroll kernel: [`packages/payroll-calc/`](packages/payroll-calc/) — L3 in `hr-regulated-domain/references/`
- Migrations: [database-migrations-and-state.md](docs/architecture/database-migrations-and-state.md) — `@hr-data-custody` (T2)
- AI governance: [docs/ai-governance/](docs/ai-governance/) — `@hr-regulated-domain` (T3)

## Orchestration

**Native runtime:** [cursor-3-native-runtime.md](docs/meta/cursor-3-native-runtime.md) · `/multitask`, `/worktree`, `/best-of-n` · hooks enforce process.

Sequence: [`.cursor/rules/orchestrator-hr-erp.mdc`](.cursor/rules/orchestrator-hr-erp.mdc) · [ADR 0011](specs/alignment/decisions/0011-function-lane-orchestration.md).

**Harness:** `npm run governance:lint` → `npm run governance:plan` → parallel native subagents → `npm run governance:ci`

**Phase 2 evidence:** `npm run governance:evidence` · `npm run governance:cloud-session` · [ADR 0019](specs/alignment/decisions/0019-harness-phase2-evidence-adaptation-runtime.md)

**Safety:** Do not set `NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN` on Vercel Production. Production JWT mint scripts require `ALLOW_PRODUCTION_JWT_MINT=1` (Human authorization). Demo preview on a Production-only deploy requires `ALLOW_DEMO_PREVIEW_ON_PRODUCTION=1` (Human authorization) in addition to `ALLOW_DEMO_PREVIEW_SIGNIN=1`.

**Rules of engagement**

- **Orchestration:** Hooks + `@skill-router` (max **3** skill bodies per sub-task); T0 loads zero skills.
- **Engineering:** PO gate injected via `beforeSubmitPrompt` hook when tier ≥ T1.
- **QA:** UAC from Feature brief verbatim; `@hr-quality-lab` + [docs/QA.md](docs/QA.md).
- **Value (T1+):** value-delivery-record required in PR body (strict lint); harness-only exempt — ADR 0019.
- **FinOps (T4):** `@hr-swarm-governance` when ≥2 delegated subagents.
- **PR body:** `npm run governance:pr-body` or hook `stop` → `.cursor/hooks-output/pr-body-stub.md`

**Adaptation plane:** [governance-continuous-learning.md](docs/meta/governance-continuous-learning.md) · ADRs [0017](specs/alignment/decisions/0017-reflective-governance-fabric.md)–[0019](specs/alignment/decisions/0019-harness-phase2-evidence-adaptation-runtime.md).

**Collaboration plane (Harness HITL):** [ADR 0020](specs/alignment/decisions/0020-collaboration-plane-harness-hitl.md) · `@hr-human-collaboration` · [collaboration-plan.md](specs/templates/collaboration-plan.md) — distinct from Product HITL in [docs/ai-governance/HITL_POLICY.md](docs/ai-governance/HITL_POLICY.md).

**AI / MLOps pointers:** [SLM-first ADR](docs/architecture/adrs/0001-slm-first-inference-routing.md) · [Prediction logging](docs/ml/prediction-logging-and-drift.md) · [Agent MCP threat model](docs/security/agent-mcp-threat-model.md)

## Definition of Done

Before pushing a feature branch or opening a PR:

```bash
./scripts/verify.sh
```

This mirrors the `ci / web` job (lint, governance, build, unit tests). CI uses **Node 22 + npm 10** — `package.json` pins `packageManager: npm@10.9.2`; do not regenerate `package-lock.json` with npm 11.

Full QA parity (integration + e2e) requires Postgres and demo seed — see [docs/QA.md](docs/QA.md#ci-e2e-prerequisites).

**Agent learnings (portfolio):** [Github Manager docs/ci-hardening-learnings.md](https://github.com/SafetyMP/Github-Manager/blob/main/docs/ci-hardening-learnings.md)
