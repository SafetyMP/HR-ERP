# DevOps product lifecycle framework

**Status:** Active  
**ADR:** [0015](../../specs/alignment/decisions/0015-devops-product-lifecycle-framework.md)  
**Global skill:** `~/.cursor/skills/devops-product-lifecycle/`  
**Project overlay:** `@hr-devops-lifecycle`

## Purpose

Connect **delivery operations** (CI/CD, deploy, workers) with **product planning** (S&OP, IBP) and **value proof** (brief → deploy → outcome) for Cursor agents and humans.

## Concepts (software-native)

| Term | Meaning in this repo |
|------|----------------------|
| **S&OP** | Reconcile demand (briefs, defects, commitments) vs supply (capacity, release train, CI/infra) each cycle |
| **IBP** | Cross-functional checkpoint: finance, product, engineering, risk before closing a cycle or expanding platform |
| **Value delivery** | Traceable record from PO gate/UAC through deploy evidence to an outcome metric |
| **release_ops** | Manifest function lane for ops path changes (T2+) |

## HR ERP Phase 1 topology

| Layer | Production |
|-------|------------|
| Web | Vercel git integration (`main` → Production, `iad1`) |
| CI | GitHub Actions `quality-gate` (PR) + `deploy` (main gate only) |
| DB | Single `DATABASE_URL` (ADR 0004) |
| Workers | Redis + `worker:integrations` / `worker:webhooks` |
| OCI | GHCR on GitHub Release (optional) |

**Anti-pattern (documented RCA):** GitHub-driven `vercel deploy --prebuilt` after `vercel pull` baking empty secrets into standalone output — removed; see [vercel-managed-phase1-environment.md](../operations/vercel-managed-phase1-environment.md).

## Templates

| Template | Use |
|----------|-----|
| [sop-cycle.md](../../specs/templates/sop-cycle.md) | Planning cycle reconciliation |
| [ibp-checkpoint.md](../../specs/templates/ibp-checkpoint.md) | Cycle close / platform PR |
| [value-delivery-record.md](../../specs/templates/value-delivery-record.md) | Per-ship value proof |

## Agent invocation

```text
npm run governance:lint   # suggests release_ops when ops paths change
@devops-product-lifecycle # global patterns
@hr-devops-lifecycle      # HR ERP grounding (this repo)
```

## Related

- [stakeholder-value-plan.md](../product/stakeholder-value-plan.md) — product demand priorities
- [competitive-ops-inventory.md](../product/competitive-ops-inventory.md) — CI/CD inventory
- [hr-product-owner-operating-model.md](../product/hr-product-owner-operating-model.md) — PO gate (value demand side)
