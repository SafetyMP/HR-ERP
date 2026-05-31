# HR ERP project skills — revamp 2026-05-28 · manifest v4 (2026-05-30)

**Format:** L1 frontmatter, L2 body, L3 `references/`.

**Router:** Global `@skill-router` + `@governance-tier-gate` (`~/.cursor/skills/`).

## Project skills (10)

| Skill | Invoke | Min tier | Trigger |
|-------|--------|----------|---------|
| [hr-product-gate](hr-product-gate/SKILL.md) | `@hr-product-gate` | T1 | PO gate, Feature briefs, UAC |
| [hr-domain-boundaries](hr-domain-boundaries/SKILL.md) | `@hr-domain-boundaries` | T1 | Architecture, schemas, cross-context APIs |
| [hr-data-custody](hr-data-custody/SKILL.md) | `@hr-data-custody` | T2 | DDL, migrations |
| [hr-devops-lifecycle](hr-devops-lifecycle/SKILL.md) | `@hr-devops-lifecycle` | T2 | CI/CD, Vercel, ops docs; co-loads `@devops-product-lifecycle` |
| [hr-regulated-domain](hr-regulated-domain/SKILL.md) | `@hr-regulated-domain` | T3 | Pay/compliance, payroll-calc, AI governance |
| [hr-product-mcp-governance](hr-product-mcp-governance/SKILL.md) | `@hr-product-mcp-governance` | T3 | In-app copilot MCP catalog/transport |
| [hr-quality-lab](hr-quality-lab/SKILL.md) | `@hr-quality-lab` | T1 | Tests, QA.md, chaos fixtures |
| [hr-swarm-governance](hr-swarm-governance/SKILL.md) | `@hr-swarm-governance` | T4 | ≥2 Tasks, post-mortems, community PRs |
| [hr-orchestration-lanes](hr-orchestration-lanes/SKILL.md) | `@hr-orchestration-lanes` | T1 | Function-lane DAG, path-trigger recipes |
| [hr-foundation-governance](hr-foundation-governance/SKILL.md) | `@hr-foundation-governance` | T3 | Harness/meta/manifest v4 (`disable-model-invocation`) |

Risk tiers: [governance-manifest.yaml](../governance/governance-manifest.yaml) (v4) · ADR [0010](../../specs/alignment/decisions/0010-agent-risk-tier-governance.md) · [0011](../../specs/alignment/decisions/0011-function-lane-orchestration.md) · [0016](../../specs/alignment/decisions/0016-agent-harness-foundation.md)

## Global essentials

See [global-skills.lock.json](../governance/global-skills.lock.json) · `npm run governance:sync-check`

## Workspace grounding

1. Confirm workspace root is this HR ERP checkout (`package.json`, `AGENTS.md`, `prisma/`, `specs/`).
2. Verify paths with Read/Grep before citing.
3. Use `npm run` scripts from root `package.json`.
