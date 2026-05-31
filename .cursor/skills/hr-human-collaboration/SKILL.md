---
name: hr-human-collaboration
description: >-
  Collaboration plane (Harness HITL) — seven-phase human-agent loop: proposal,
  options, human tradeoffs, execute, revalidate, specialized tools, output review.
  Use at T1+ before specialized skills; load routing portion automatically at orchestration.
risk: safe
minRiskTier: T1
source: project
disable-model-invocation: true
---

# HR human collaboration (Collaboration plane)

## Use when

- Orchestrating T1+ work (Orchestrator step 0)
- Presenting strategy options with risk/reward tradeoffs
- Recording human decisions before specialized skills or Task delegation
- Phase 7 output review against approved strategy

## Do not use when

- T0 docs-only chore (`step 1 chore N/A`)
- Product employment-AI runtime actions — use Product HITL (`lib/governance/hitl.ts`)

## Seven-phase checklist

| Phase | Mode | Action |
|-------|------|--------|
| 1 Proposal | HOTL | Restate intent, tier, bounded contexts |
| 2 Options | HOTL | ≥2 strategies with risk, reward, **rollback**, lanes |
| 3 Human input | **HITL** | Record principal + timestamp; routing skills only |
| 4 Execute | HOTL | Implement approved plan |
| 5 Revalidate | HOTL | Drift check; human confirms before phase 6 |
| 6 Specialized | **HITL** | Tasks, MCP, `@hr-regulated-domain`, etc. |
| 7 Output review | HOTL | Verifier confirms deliverables match `chosenStrategy` |

## Protocols

- **Reject at 3 or 5:** return to phase 2; append `rejectionHistory[]`
- **Timeout:** never auto-approve revalidation; deny specialized unlock or escalate to Human PO
- **Challenge:** human edits plan sections or alternate `chosenStrategy`

## Anti-patterns

- Prompt-only “ask user first” without hook/manifest gate
- Loading specialized skills before phase 6 / revalidation
- Timeout-as-approval
- Rubber-stamping options without reading rollback column

## Resources

- [references/collaboration-loop.md](references/collaboration-loop.md)
- [specs/templates/collaboration-plan.md](../../../specs/templates/collaboration-plan.md)
- [ADR 0020](../../../specs/alignment/decisions/0020-collaboration-plane-harness-hitl.md)
