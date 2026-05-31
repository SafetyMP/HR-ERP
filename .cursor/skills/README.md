# HR ERP project skills

**Team map:** [docs/meta/agent-team-map.md](../../docs/meta/agent-team-map.md) — canonical lane ↔ skill roster.

**Format:** L1 frontmatter, L2 body, L3 `references/`.

**Router:** Global `@skill-router` + `@governance-tier-gate` (`~/.cursor/skills/`).

## Project skills (13)

| Skill | Invoke | Min tier | Trigger |
|-------|--------|----------|---------|
| [hr-human-collaboration](hr-human-collaboration/SKILL.md) | `@hr-human-collaboration` | T1 | Collaboration plane — seven-phase Harness HITL |
| [hr-product-gate](hr-product-gate/SKILL.md) | `@hr-product-gate` | T1 | PO gate, Feature briefs, UAC |
| [hr-domain-boundaries](hr-domain-boundaries/SKILL.md) | `@hr-domain-boundaries` | T1 | Architecture, schemas, cross-context APIs |
| [hr-data-custody](hr-data-custody/SKILL.md) | `@hr-data-custody` | T2 | DDL, migrations |
| [hr-devops-lifecycle](hr-devops-lifecycle/SKILL.md) | `@hr-devops-lifecycle` | T2 | CI/CD, Vercel, S&OP/IBP/VDR; co-loads `@devops-product-lifecycle` |
| [hr-regulated-domain](hr-regulated-domain/SKILL.md) | `@hr-regulated-domain` | T3 | Pay/compliance, payroll-calc, AI governance |
| [hr-product-mcp-governance](hr-product-mcp-governance/SKILL.md) | `@hr-product-mcp-governance` | T3 | In-app copilot MCP catalog/transport |
| [hr-quality-lab](hr-quality-lab/SKILL.md) | `@hr-quality-lab` | T1 | Tests, QA.md, chaos fixtures |
| [hr-swarm-governance](hr-swarm-governance/SKILL.md) | `@hr-swarm-governance` | T4 | ≥2 Tasks, FinOps, post-mortems |
| [hr-orchestration-lanes](hr-orchestration-lanes/SKILL.md) | `@hr-orchestration-lanes` | T1 | Function-lane DAG, `/multitask` recipes |
| [hr-contributor-handoff](hr-contributor-handoff/SKILL.md) | `@hr-contributor-handoff` | T1 | Community PR/issue triage, handoff JSON |
| [hr-foundation-governance](hr-foundation-governance/SKILL.md) | `@hr-foundation-governance` | T3 | Harness/meta/manifest v4 (`disable-model-invocation`) |
| [hr-governance-learning](hr-governance-learning/SKILL.md) | `@hr-governance-learning` | T2 | Adaptation: reflect/promote/DMAIC (`disable-model-invocation`) |

### Harness vs adaptation

| Skill | Plane | Do not use for |
|-------|-------|----------------|
| `hr-foundation-governance` | Policy + Evidence setup | Promote/reflect (use governance-learning) |
| `hr-governance-learning` | Adaptation | One-off manifest edits (use foundation-governance) |

### Phase 2 commands (ADR 0019)

```bash
npm run governance:evidence
npm run governance:evidence:collect -- --handoff specs/.../orchestrator-handoff.json --principal "Name"
npm run governance:cloud-session
```

ADRs: [0010](../../specs/alignment/decisions/0010-agent-risk-tier-governance.md) · [0011](../../specs/alignment/decisions/0011-function-lane-orchestration.md) · [0016](../../specs/alignment/decisions/0016-agent-harness-foundation.md) · [0017](../../specs/alignment/decisions/0017-reflective-governance-fabric.md) · [0018](../../specs/alignment/decisions/0018-dmaic-pdca-adaptation-methodology.md) · [0019](../../specs/alignment/decisions/0019-harness-phase2-evidence-adaptation-runtime.md) · [0020](../../specs/alignment/decisions/0020-collaboration-plane-harness-hitl.md)

## Global essentials

See `~/.cursor/skills/README.md` (L1 index) · [`global-skills.lock.json`](../governance/global-skills.lock.json) · `npm run governance:sync-check`

Framework facades (JIT): `@nextjs-app-router`, `@prisma-7-postgres`, `@vitest-playwright-qa`, `@buf-openapi-contracts`, `@context7-doc-fetch` — wired in manifest `frameworkSkills`.

## Workspace grounding

1. Confirm workspace root is this HR ERP checkout (`package.json`, `AGENTS.md`, `prisma/`, `specs/`).
2. Verify paths with Read/Grep before citing.
3. Use `npm run` scripts from root `package.json`.

**Banned in handoffs:** legacy `hr-erp-*` skill names and `_archived` paths — use consolidated `hr-*` skills only.
