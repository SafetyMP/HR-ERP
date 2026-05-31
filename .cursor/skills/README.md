# HR ERP project skills — revamp 2026-05-28

**Format:** [Antigravity SKILL.md pattern](https://github.com/sickn33/antigravity-awesome-skills) — L1 frontmatter, L2 body (When / Do not / Instructions / Limitations), L3 `references/`.

**Router:** Global `@skill-router` + `@governance-tier-gate` (`~/.cursor/skills/`). Legacy 15-skill stack archived under `_archived/2026-05-28-revamp/`.

## Project skills (9)

| Skill | Invoke | Min tier | Trigger |
|-------|--------|----------|---------|
| [hr-product-gate](hr-product-gate/SKILL.md) | `@hr-product-gate` | T1 | PO gate, Feature briefs, UAC |
| [hr-domain-boundaries](hr-domain-boundaries/SKILL.md) | `@hr-domain-boundaries` | T1 | Architecture, schemas, cross-context APIs |
| [hr-data-custody](hr-data-custody/SKILL.md) | `@hr-data-custody` | T2 | DDL, migrations |
| [hr-devops-lifecycle](hr-devops-lifecycle/SKILL.md) | `@hr-devops-lifecycle` | T2 | CI/CD, Vercel, ops docs; co-loads global `@devops-product-lifecycle` |
| [hr-regulated-domain](hr-regulated-domain/SKILL.md) | `@hr-regulated-domain` | T3 | Pay/compliance, payroll-calc, AI governance |
| [hr-product-mcp-governance](hr-product-mcp-governance/SKILL.md) | `@hr-product-mcp-governance` | T3 | In-app copilot MCP catalog/transport |
| [hr-quality-lab](hr-quality-lab/SKILL.md) | `@hr-quality-lab` | T1 | Tests, QA.md, chaos fixtures |
| [hr-swarm-governance](hr-swarm-governance/SKILL.md) | `@hr-swarm-governance` | T4 | ≥2 Tasks, post-mortems, community PRs |
| [hr-orchestration-lanes](hr-orchestration-lanes/SKILL.md) | `@hr-orchestration-lanes` | T1 | Function-lane DAG, path-trigger recipes |

**Global (product MCP hybrid):** `@protect-mcp-governance` — Cedar/receipts at transport; see [antigravity-product-mcp-governance.md](../../docs/meta/antigravity-product-mcp-governance.md).

**Global (DevOps lifecycle):** `@devops-product-lifecycle` — S&OP, IBP, value delivery; see [devops-product-lifecycle-framework.md](../../docs/meta/devops-product-lifecycle-framework.md).

Risk tiers: [governance-manifest.yaml](../governance/governance-manifest.yaml) (v2) · ADR [0010](../../specs/alignment/decisions/0010-agent-risk-tier-governance.md) · [0011](../../specs/alignment/decisions/0011-function-lane-orchestration.md) · [harness guide](../../docs/meta/cursor-antigravity-harness.md).

## Global essentials (install separately)

Installed in `~/.cursor/skills/`: `cursor-harness-scope`, `protect-mcp-governance`, `skill-router`, `governance-tier-gate`, `concise-planning`, `lint-and-validate`, `systematic-debugging`, `cc-skill-security-review`, `repo-architect`, `testing-patterns`, `subagent-orchestrator`.

## Workspace grounding

1. Confirm workspace root is this HR ERP checkout (`package.json`, `AGENTS.md`, `prisma/`, `specs/`).
2. Verify paths with Read/Grep before citing.
3. Use `npm run` scripts from root `package.json` — not training defaults.
