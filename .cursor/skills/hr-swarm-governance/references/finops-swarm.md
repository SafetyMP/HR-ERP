# FinOps swarm (T4)

Distinct from in-app Inference API budgets (ADR 0001). Use for Cursor **Task** orchestration only.

## Scope

- Delegated Task model choice, handoff churn, swarm discipline
- **Not** product runtime LLM spend — use `@hr-regulated-domain` + ADR 0001 for inference routing

## Model tiers (defaults)

| Tier | Task class |
|------|------------|
| **Fast** (default) | Single-file fix, lint, straightforward test triage |
| **Medium** | Cross-file refactors, security design, compliance test plans |
| **Largest** | Human opt-in only: multi-system incidents, novel ADR conflicts |

State task class and model tier in each delegated Task prompt.

## Ping-pong circuit breaker

**Trip:** Two full round-trips between the **same two** roles without merge artifact + checkpoint.

**On trip:** Freeze further Tasks between those roles. Run one consolidation pass (code-reviewer or Human) with merge recommendation.

## FinOps note template (≤6 lines)

```
FinOps: brief/slug ___ | Task count ___ | default tier ___ | loop breaker: clear/tripped |
infra flag: none/spot-serverless-review ___ | ADR0001 N/A (agent-only) ___
```

## Cloud economics checklist

1. Workload shape → prefer minimal steady pools; spot for batch; serverless for sporadic work.
2. Proof of need: metrics or load-test before multi-AZ / large node counts.
3. SLO vs cost documented when downsizing.

## References

- [swarm-multiagent-rerun-checklist.md](../../../specs/templates/swarm-multiagent-rerun-checklist.md)
- [ADR 0001 — SLM-first inference routing](../../../docs/architecture/adrs/0001-slm-first-inference-routing.md)
