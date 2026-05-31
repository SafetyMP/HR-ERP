# Collaboration loop reference (Harness HITL)

Normative: [ADR 0020](../../../../specs/alignment/decisions/0020-collaboration-plane-harness-hitl.md).

## Harness vs Product HITL

| | Collaboration plane | Product HITL |
|---|---------------------|--------------|
| When | IDE / design-time | Runtime employment actions |
| Artifact | `.cursor/plans/*.md`, handoff | `GovernanceAuditEvent` |
| Skill | `@hr-human-collaboration` | `@hr-regulated-domain` AI L3 |

## Example phase 2 options table

| Strategy | Risk | Reward | Rollback | Lanes | Deferred skills |
|----------|------|--------|----------|-------|-----------------|
| A — minimal diff | Low scope miss | Fast ship | Revert single PR | builder, verifier | hr-regulated-domain |
| B — worktree DDL | Migration conflict | Safe DDL | Drop worktree branch | custodian, builder | hr-data-custody |

## Revalidation checklist (phase 5)

- [ ] `riskTier` unchanged or re-approved if increased
- [ ] Diff still matches `chosenStrategy` scope
- [ ] `matchedTriggers` unchanged or counsel re-run
- [ ] `revalidationConfirmed` set with principal before phase 6

## Phase 7 output review

Verifier compares PR diff / test scope to `humanDecisionRecord.chosenStrategy`. On mismatch: emit `collaboration_divergence` signal; advise return to phase 3.
