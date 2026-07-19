# Site contract

## Gates

| Command | Purpose |
|---|---|
| `./scripts/verify.sh` | Functional and static acceptance |
| `./scripts/adversarial.sh` | Authorized local adversarial probes |

The corporate handoff fixes scope. The site manager assigns ADRs; site specialists write;
the root orchestrator dispatches nondelegating workers and runs gate commands; operations
excellence reviews immutable root-produced evidence. Work in isolated roots, never edit
corporate approval state, and never self-approve. A site role cannot return work to
corporate design; that boundary requires an explicit user rework authorization.

Site id: `hr-erp`. Prior Cursor Harness v4 is under `_archives/harness-v4/`.

## Definition of Done

Before pushing a feature branch or opening a PR:

```bash
./scripts/verify.sh
```

This mirrors the `ci / web` job (lint, governance, build, unit tests). CI uses **Node 22 + npm 10** — `package.json` pins `packageManager: npm@10.9.2`; do not regenerate `package-lock.json` with npm 11.

Full QA parity (integration + e2e) requires Postgres and demo seed — see [docs/QA.md](docs/QA.md#ci-e2e-prerequisites).

## Agent guide (project)

**Repository role:** Evergreen OSS **reference application** for multi-tenant HR SaaS. Not a certified payroll vendor — [docs/meta/evergreen-open-source-positioning.md](docs/meta/evergreen-open-source-positioning.md).

**Team roster:** [docs/meta/agent-team-map.md](docs/meta/agent-team-map.md).

**Project skills:** [.cursor/skills/README.md](.cursor/skills/README.md) · site delivery: [.cursor/skills/site-delivery/SKILL.md](.cursor/skills/site-delivery/SKILL.md).

**Global skills (lazy):** `~/.cursor/skills/README.md` · `@skill-router` at T1+ per `~/.cursor/rules/core-dynamic-skills.mdc`.

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

### Orchestration

**Native runtime:** [cursor-3-native-runtime.md](docs/meta/cursor-3-native-runtime.md) · prefer **Auto-review** Run Mode · `/multitask`, `/worktree`, `/best-of-n` · hooks + `governance:ci` / `./scripts/verify.sh` as the deterministic merge bar.

Sequence: [`.cursor/rules/orchestrator-hr-erp.mdc`](.cursor/rules/orchestrator-hr-erp.mdc) · [ADR 0011](specs/alignment/decisions/0011-function-lane-orchestration.md).

**Harness scripts:** `npm run governance:lint` → `npm run governance:plan` → `npm run governance:ci` (hook entrypoint archived under `_archives/harness-v4/`; shared hook libs remain under `.cursor/hooks/` for governance scripts).

**Phase 2 evidence:** `npm run governance:evidence` · `npm run governance:cloud-session` · [ADR 0019](specs/alignment/decisions/0019-harness-phase2-evidence-adaptation-runtime.md)

**Safety:** Do not set `NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN` on Vercel Production. Production JWT mint scripts require `ALLOW_PRODUCTION_JWT_MINT=1` (Human authorization). Demo preview on a Production-only deploy requires `ALLOW_DEMO_PREVIEW_ON_PRODUCTION=1` (Human authorization) in addition to `ALLOW_DEMO_PREVIEW_SIGNIN=1`.

**Agent learnings (portfolio):** [Github Manager docs/ci-hardening-learnings.md](https://github.com/SafetyMP/Github-Manager/blob/main/docs/ci-hardening-learnings.md)
