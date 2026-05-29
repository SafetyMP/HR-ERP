<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent instructions — HR ERP

This repository uses **Cursor 3 native runtime** + tier-gated skills (revamp 2026-05-28). Start with [cursor-3-native-runtime.md](docs/meta/cursor-3-native-runtime.md); hooks in [`.cursor/hooks.json`](.cursor/hooks.json).

**Team MCP (IDE plane):** [`.cursor/mcp.json`](.cursor/mcp.json) — context7, prisma. Product copilot MCP is separate (`lib/copilot/`).

**Workspace grounding:** Follow [`.cursor/skills/README.md`](.cursor/skills/README.md) — verify paths in **this** checkout.

**Always-on boundaries:** [`.cursor/rules/repo-boundaries.mdc`](.cursor/rules/repo-boundaries.mdc) + [docs/architecture/](docs/architecture/).

Before new capabilities, read:

- **[Stakeholder value plan](docs/product/stakeholder-value-plan.md)** — single active forward plan (2026-05-28 reset)
- [HR Product Owner operating model](docs/product/hr-product-owner-operating-model.md)
- Feature briefs: [docs/product/feature-briefs/](docs/product/feature-briefs/) · [template](docs/product/feature-brief-template.md)
- Compliance: [docs/compliance/](docs/compliance/) — load `@hr-regulated-domain` (T3)
- Payroll kernel: [`packages/payroll-calc/`](packages/payroll-calc/) — L3 in `hr-regulated-domain/references/`
- Migrations: [database-migrations-and-state.md](docs/architecture/database-migrations-and-state.md) — `@hr-data-custody` (T2)
- AI governance: [docs/ai-governance/](docs/ai-governance/) — `@hr-regulated-domain` (T3)

## Project skills (8)

| Skill | When |
|-------|------|
| `@hr-product-gate` | PO gate, UAC, friction (T1+) |
| `@hr-domain-boundaries` | Architecture, bounded contexts |
| `@hr-data-custody` | DDL, migrations, packaging (T2+) |
| `@hr-regulated-domain` | Pay/compliance/AI/MLOps (T3+) |
| `@hr-product-mcp-governance` | In-app copilot MCP catalog/transport (T3) |
| `@hr-quality-lab` | Tests, QA.md |
| `@hr-swarm-governance` | ≥2 Tasks, post-mortems (T4) |
| `@hr-orchestration-lanes` | Lane recipes, sentinel SLA (T1+) |

Global: `@cursor-harness-scope`, `@protect-mcp-governance` (Cedar/receipts at MCP transport). See [antigravity-product-mcp-governance.md](docs/meta/antigravity-product-mcp-governance.md).

Legacy 15-skill stack: `.cursor/skills/_archived/2026-05-28-revamp/`

## Orchestration

**Native runtime:** [cursor-3-native-runtime.md](docs/meta/cursor-3-native-runtime.md) · `/multitask`, `/worktree`, `/best-of-n` · hooks enforce process.

Sequence: [`.cursor/rules/orchestrator-hr-erp.mdc`](.cursor/rules/orchestrator-hr-erp.mdc) · [ADR 0011](specs/alignment/decisions/0011-function-lane-orchestration.md). **Harness:** `npm run governance:lint` → `npm run governance:plan` → parallel native subagents → `npm run governance:ci` (includes `governance:production-safety`; hooks are IDE-only).

**Safety:** Do not set `NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN` on Vercel Production. Production JWT mint scripts require `ALLOW_PRODUCTION_JWT_MINT=1` (Human authorization). Demo preview on a Production-only deploy requires `ALLOW_DEMO_PREVIEW_ON_PRODUCTION=1` (Human authorization) in addition to `ALLOW_DEMO_PREVIEW_SIGNIN=1`.

**Rules of engagement**

- **Orchestration:** Hooks + `@skill-router` (max **3** skill bodies per sub-task in manifest v3); T0 loads zero skills.
- **Engineering:** PO gate injected via `beforeSubmitPrompt` hook when tier ≥ T1.
- **QA:** UAC from Feature brief verbatim; `@hr-quality-lab` + [docs/QA.md](docs/QA.md).
- **FinOps (T4):** `@hr-swarm-governance` when ≥2 delegated subagents.
- **PR body:** `npm run governance:pr-body` or hook `stop` → `.cursor/hooks-output/pr-body-stub.md`

**Global essentials** (in `~/.cursor/skills/`): `concise-planning`, `systematic-debugging`, `lint-and-validate`, `testing-patterns`, `cc-skill-security-review`, `skill-router`, `governance-tier-gate`, `repo-architect`.

**AI / MLOps pointers:** [SLM-first ADR](docs/architecture/adrs/0001-slm-first-inference-routing.md) · [Prediction logging](docs/ml/prediction-logging-and-drift.md) · [Agent MCP threat model](docs/security/agent-mcp-threat-model.md)
