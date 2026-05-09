# Multi-agent rerun checklist — realistic swarm grade (principal auditor)

Use when the Human Lead wants **high rubric-A** Collaboration scores (explicit specialist lanes—not a heroic single-thread). Adapt role count to repo rules; sixteen is an upper-bound metaphor—**delegation count** beats headcount fiction.

Before opening Implementation Tasks:

## 1. PO gate captured in-band

Paste the **verbatim** PO preamble (see **bullet __6__**, *Verbatim preamble on delegated Tasks*, in [.cursor/rules/orchestrator.mdc](../../.cursor/rules/orchestrator.mdc); cross-check checklist lines with **bullet __1__**) plus your filled values into **every** coordinating transcript or delegated Task prompt.

## 2. Task decomposition template

| Delegated Task intent | Attached skills/rules (minimal) |
| --- | --- |
| Architecture-only (readonly blueprint) | `hr-erp-principal-architecture`, `hr-erp-innovation-rd`, phase ADRs, `@hr-product-owner` + Feature brief path |
| Legal checklist (controls + citations); non-advice | `agent-legal-hr-compliance`, `@hr-backend-compliance` if pay/time surfaces |
| Implementation (writes code) | `hr-code-health`, `hr-erp-security-identity`, `agent-security`, `@hr-product-owner` + brief; conditional `hr-backend-compliance` / `hr-payroll-calculation-engine` |
| Security review-only | `hr-erp-security-identity`, `agent-security`, `specs/templates/security-review.md` when required |
| QA / tests | `hr-erp-qa-chaos`, `agent-qa`, `@hr-backend-compliance` + golden vectors when pay math |
| FinOps / Task efficiency (≥2 Tasks on one feature) | `hr-erp-finops-swarm`; state **model tier** per task class; acknowledge **ping-pong** breaker; optional `agent-finops` when Human mandates cost gates (distinct from ADR 0001 product inference) |

## 3. Artifact chain for audit replay

Ensure the PR bundles **one** contiguous thread or PR description section listing:

1. Brief path + checkpoint line count (≤6-line block).
2. Architecture spec slug or spike ADR.
3. **Golden thread stub** ([golden-thread-trace-table.md](./golden-thread-trace-table.md) or regulated drill below).
4. CI / test commands with PASS evidence links.

Without (1)-(3), **do not** claim multi-agent choreography integrity in retrospectives—score as single-thread honesty.
