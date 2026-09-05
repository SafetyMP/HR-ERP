# HR ERP — community agent contract

This repository is an **HR scaffold for testing agent governance** (T0–T4) on a multi-tenant SaaS fixture. ESS, payroll, and benefits are a **fixture domain** so hooks have realistic blast radius. This is **not** a certified payroll vendor and **not** a production HRIS.

Corporate/site factory overlay (gates, non-self-approval, site id `hr-erp`): [docs/factory-overlay.md](docs/factory-overlay.md).  
September 2026 pivot: [docs/DESIGN-PIVOT.md](docs/DESIGN-PIVOT.md).

## Commands

| Command | Purpose |
|---|---|
| `npm run governance:lint` | Tier + path classification |
| `npm run governance:plan` | Delegation / handoff plan |
| `npm run governance:ci` | Merge-bar governance gate |
| `./scripts/harness/verify.sh` | Definition of Done (lint, governance, build, unit tests) |
| `./scripts/verify.sh` | Optional human wrapper (same gate; outside digest boundary) |
| `./scripts/adversarial.sh` | Authorized local adversarial probes only |

Full e2e parity needs Postgres and demo seed — [docs/QA.md](docs/QA.md#ci-e2e-prerequisites). CI uses **Node 22 + npm 10** (`packageManager: npm@10.9.2`); do not regenerate `package-lock.json` with npm 11.

## Never

- Never treat this tree as production payroll, legal HR advice, or a company HRIS.
- Never put real employee, tax, or payroll PII in fixtures, issues, or repros — synthetic data only.
- Never claim a green gate from prose. Run `./scripts/harness/verify.sh` (or the documented wrapper) and keep the output.
- Never duplicate Cedar, receipt ledgers, or sandbox runtimes here. Pair [FidusGate](https://github.com/SafetyMP/FidusGate) for runtime receipts.
- Never set `NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN` on Vercel Production. Production JWT mint requires `ALLOW_PRODUCTION_JWT_MINT=1` (human authorization). Demo preview on a Production-only deploy also needs `ALLOW_DEMO_PREVIEW_ON_PRODUCTION=1`.

## Agent guide (project)

**Repository role:** Teaching kit / governance harness on an HR fixture. Not a certified payroll vendor — [docs/DESIGN-PIVOT.md](docs/DESIGN-PIVOT.md), [docs/meta/evergreen-open-source-positioning.md](docs/meta/evergreen-open-source-positioning.md).

**Team roster:** [docs/meta/agent-team-map.md](docs/meta/agent-team-map.md).

**Project skills:** [.cursor/skills/README.md](.cursor/skills/README.md) · community copy of data-custody: [.github/skills/hr-data-custody/SKILL.md](.github/skills/hr-data-custody/SKILL.md) · site delivery: [.cursor/skills/site-delivery/SKILL.md](.cursor/skills/site-delivery/SKILL.md).

**Global skills (lazy):** `~/.cursor/skills/README.md` · `@skill-router` at T1+ per `~/.cursor/rules/core-dynamic-skills.mdc`.

**Team MCP (IDE plane):** [`.cursor/mcp.json`](.cursor/mcp.json) — context7, prisma. Product copilot MCP is separate (`lib/copilot/`).

**Always-on boundaries:** [`.cursor/rules/repo-boundaries.mdc`](.cursor/rules/repo-boundaries.mdc) + [docs/architecture/](docs/architecture/).

Before new capabilities, read:

- **[Design pivot](docs/DESIGN-PIVOT.md)** — compete on T0–T4 governance, not HR features
- **[Stakeholder value plan](docs/product/stakeholder-value-plan.md)** — fixture walk paths (W1–W7), not a buyer HRIS roadmap
- [HR Product Owner operating model](docs/product/hr-product-owner-operating-model.md)
- Feature briefs: [docs/product/feature-briefs/](docs/product/feature-briefs/) · [template](docs/product/feature-brief-template.md)
- Compliance: [docs/compliance/](docs/compliance/) — load `@hr-regulated-domain` (T3)
- Payroll kernel (fixture): [`packages/payroll-calc/`](packages/payroll-calc/) — L3 in `hr-regulated-domain/references/`
- Migrations: [database-migrations-and-state.md](docs/architecture/database-migrations-and-state.md) — `@hr-data-custody` (T2)
- AI governance: [docs/ai-governance/](docs/ai-governance/) — `@hr-regulated-domain` (T3)

### Orchestration

**Native runtime:** [cursor-3-native-runtime.md](docs/meta/cursor-3-native-runtime.md) · prefer **Auto-review** Run Mode · `/multitask`, `/worktree`, `/best-of-n` · hooks + `governance:ci` / `./scripts/verify.sh` as the deterministic merge bar.

Sequence: [`.cursor/rules/orchestrator-hr-erp.mdc`](.cursor/rules/orchestrator-hr-erp.mdc) · [ADR 0011](specs/alignment/decisions/0011-function-lane-orchestration.md).

**Harness scripts:** `npm run governance:lint` → `npm run governance:plan` → `npm run governance:ci` (hook entrypoint archived under `_archives/harness-v4/`; shared hook libs remain under `.cursor/hooks/` for governance scripts).

**Phase 2 evidence:** `npm run governance:evidence` · `npm run governance:cloud-session` · [ADR 0019](specs/alignment/decisions/0019-harness-phase2-evidence-adaptation-runtime.md)
