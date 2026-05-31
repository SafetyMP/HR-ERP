---
name: hr-devops-lifecycle
description: >-
  HR ERP DevOps overlay: Vercel git deploy, GHA quality gate, Redis workers,
  Phase 1 topology. Co-loads @devops-product-lifecycle. Use for ops paths in this
  repo.
risk: medium
minRiskTier: T2
source: project
disable-model-invocation: true
---

# HR DevOps lifecycle

## Use this skill when

- Working in the **authoritative HR ERP** checkout on CI, deploy, or operations docs
- S&OP / IBP / value delivery cycles for this product ([stakeholder value plan](../../../docs/product/stakeholder-value-plan.md))

## Instructions

1. Load **`@devops-product-lifecycle`** first (portable S&OP, IBP, value patterns).
2. Read [references/hr-erp-ops.md](references/hr-erp-ops.md) before changing workflows or env contracts.
3. Use project templates under `specs/templates/` (sop-cycle, ibp-checkpoint, value-delivery-record).
4. **Value gate (ADR 0019):** T1+ product ships require a filled [value-delivery-record.md](../../../specs/templates/value-delivery-record.md); T2+ handoffs link `sopCycleId` when VDR path is set. PR lint is **strict** for T1+.
5. **Efficiency:** IBP Engineering row tracks CI duration; T4 swarms require FinOps checkpoint per `@hr-swarm-governance`.
6. **Anti-patterns:** no `vercel deploy --prebuilt` with pulled secrets; no production Kafka/multi-DB without ADR trigger.

## Resources

- [references/hr-erp-ops.md](references/hr-erp-ops.md)
- [docs/meta/devops-product-lifecycle-framework.md](../../../docs/meta/devops-product-lifecycle-framework.md)
- ADR [0015](../../../specs/alignment/decisions/0015-devops-product-lifecycle-framework.md)

## Limitations

- HR ERP Phase 1 topology only — defer Track D platform per [deferred-platform-track.md](../../../docs/product/deferred-platform-track.md)
