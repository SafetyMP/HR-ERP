# HR ERP operations grounding

## Production topology (Phase 1)

| Layer | Source | Notes |
|-------|--------|-------|
| App | Vercel git integration on `main` | Region `iad1`; see [vercel.json](../../../vercel.json) |
| CI gate | [deploy.yml](../../../.github/workflows/deploy.yml) | CI+QA only — not `vercel deploy` |
| PR CI | [quality-gate.yml](../../../.github/workflows/quality-gate.yml) | Non-`main` branches |
| Database | Single `DATABASE_URL` | ADR 0004 modular monolith |
| Workers | `worker:integrations`, `worker:webhooks` | Requires `REDIS_URL` |
| Containers | [publish-ghcr.yml](../../../.github/workflows/publish-ghcr.yml) on release | ADR 0003 |

## Key docs

- [competitive-ops-inventory.md](../../../docs/product/competitive-ops-inventory.md)
- [phase1-production-checklist.md](../../../docs/operations/phase1-production-checklist.md)
- [vercel-managed-phase1-environment.md](../../../docs/operations/vercel-managed-phase1-environment.md)

## S&OP alignment

Funded priorities: [stakeholder-value-plan.md](../../../docs/product/stakeholder-value-plan.md) §3.

## Value delivery

Template: [value-delivery-record.md](../../../specs/templates/value-delivery-record.md) — links Feature brief UAC to deploy evidence.
