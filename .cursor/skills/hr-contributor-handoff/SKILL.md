---
name: hr-contributor-handoff
description: >-
  Community PR/issue triage, appreciative contributor review, docs sync, and
  orchestrator handoff JSON. T1 advocate lane — not FinOps/swarm. Co-load
  lint-and-validate and security review when diff warrants.
risk: safe
minRiskTier: T1
source: project
disable-model-invocation: true
---

# HR contributor handoff

## Use when

- External PR review or community issue triage
- Translating human bug reports into `orchestrator-human-issue-handoff` JSON
- Post-merge docs sync (README, CONTRIBUTING, OpenAPI)

## Do not use when

- T4 multi-agent swarm FinOps (use `@hr-swarm-governance`)
- Regulated pay/compliance implementation (use `@hr-regulated-domain`)

## Instructions

1. Read [references/contributor-handoff.md](references/contributor-handoff.md).
2. **Never waive** Security, QA, PO gate, or `governance:ci` merge bars.
3. Co-load `@lint-and-validate` + `@cc-skill-security-review` when diff is non-trivial.
4. Use consolidated `hr-*` skill names in handoffs — **ban** legacy `hr-erp-*` identifiers.
5. Output handoff JSON validated against [orchestrator-human-issue-handoff.schema.json](../../../specs/templates/orchestrator-human-issue-handoff.schema.json).

## Resources

- [references/contributor-handoff.md](references/contributor-handoff.md)
- [orchestrator-human-issue-handoff.example.json](../../../specs/templates/orchestrator-human-issue-handoff.example.json)
- [agent-team-map.md](../../../docs/meta/agent-team-map.md)
