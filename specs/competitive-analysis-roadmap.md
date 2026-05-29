# HR ERP — Competitive analysis & roadmap

**Status:** Living document (reset 2026-05-28)  
**Audience:** Product, platform engineering, finance (operate TCO), counsel (compliance tiers)  
**Forward plan:** [stakeholder-value-plan.md](../docs/product/stakeholder-value-plan.md)  
**Phase anchor:** [ADR 0001 phase1 scope](alignment/decisions/0001-phase1-scope.md)

Detailed TCO: [competitive-ops-tco-worksheet.md](../docs/product/competitive-ops-tco-worksheet.md) · Executive summary: [competitive-benchmark-executive-brief.md](../docs/product/competitive-benchmark-executive-brief.md)

---

## 1. Positioning statement

HR ERP is a **Phase 1 modular monolith** (Next.js + **single Postgres**) with enterprise security scaffolding, a deterministic payroll kernel, and **strong employee/manager/HR self-service** (Features **001–022**, **155 UAC** total). Phase C connectors **023–025** shipped ([audit](../docs/product/completion-audits/features-023-025.md)). Primary segment: mid-market US+UK build platform ([ADR 0009](alignment/decisions/0009-mid-market-segment-strategy.md)).

---

## 2. Competitor segments

| Segment | Employees | Primary competitors | Buyer expects |
| --- | --- | --- | --- |
| **SMB** | 10–250 | Gusto, BambooHR | US payroll + HR in weeks |
| **Mid-market** | 250–5,000 | BambooHR Pro, Rippling, UKG, Paylocity | Recruiting, performance, payroll ops, integrations |
| **Enterprise** | 5,000+ | Workday, SAP SuccessFactors | Global HCM, SI ecosystem |

---

## 3. Feature parity matrix (today)

| Capability | HR ERP | Evidence |
| --- | --- | --- |
| Employee ESS | **Strong** | Briefs 001–007, 017, 022 shell |
| Manager workforce | **Strong** | 008, 011, 014, 015, 020 |
| Payroll ops + close | **Partial** | 016, 018; filing artifact JSON; no agency e-file |
| Benefits | **Partial** | 003, 019 life events; COBRA notice PDF counsel-gated |
| Recruiting / ATS | **Partial** | 014, 020 — win vs no ATS; lose vs Greenhouse |
| Performance | **Partial** | 012–013 demo, 015 cycles |
| Learning | **Partial** | 017 |
| Integrations | **Met** | SCIM (023), partner export (024), carrier stub (025) |
| Security / multi-tenant | **Strong** | `lib/security/`, RLS |
| AI / analytics | **Demo** | `/analytics/*` — not production ML ([deferred](../docs/product/deferred-platform-track.md)) |

### Segment verdict

- **Mid-market target:** [BambooHR + separate payroll](../docs/product/goal-beat-bamboohr-plus-payroll-stack.md) — **W1–W5 met** for demo; **W6–W7 partial** until Phase C + counsel paths complete.

---

## 4. Operations benchmark

See [competitive-ops-inventory.md](../docs/product/competitive-ops-inventory.md). HR ERP wins on **control and extensibility**; SaaS wins on **operate cost per employee** unless a dedicated platform team exists.

---

## 5. Roadmap tiers (funding order)

**Do not** fund Kafka/multi-DB for competitive gap work ([deferred-platform-track.md](../docs/product/deferred-platform-track.md)).

### Shipped — Track A + Phase B + shell

| Wave | Briefs | UAC | Audit |
| --- | --- | ---: | --- |
| ESS + manager | 001–013 | 85 | baseline + [006-013](../docs/product/completion-audits/features-006-013.md) |
| Tier 1 | 014–017 | 30 | [014-017](../docs/product/completion-audits/features-014-017.md) |
| Phase B | 018–021 | 32 | [018-021](../docs/product/completion-audits/features-018-021.md) |
| Product shell | 022 | 8 | [022](../docs/product/completion-audits/features-022.md) (complete) |

### Next — Phase C (briefs 023–025)

| Brief | Focus | Target |
| --- | --- | --- |
| 023 | SCIM/IdP production hardening | W6 |
| 024 | Payroll partner export connector | W6 |
| 025 | Benefits carrier outbound stub | W6 |

### Tier 2 — Compliance depth (counsel + engineering)

| Item | Status |
| --- | --- |
| US withholding v1 (ADR 0005) | Wired; not IRS-certified |
| UK PAYE/NI bootstrap (ADR 0007) | Wired; not RTI/filing |
| Webhook delivery (ADR 0008) | **Shipped** |
| COBRA / 834 | Counsel-gated; 019 start only |

### Deferred platform

| Item | Doc |
| --- | --- |
| Kafka, DB-per-context | ADR 0002, [deferred track](../docs/product/deferred-platform-track.md) |
| ML production scoring | [ML sequence archived](../docs/ml/implementation-sequence.md) |
| Edge / pgvector / Wasm | [architecture stubs](../docs/architecture/02-phase-bc-edge-semantic-search.md) |

---

## 6. Strategic priorities

| Priority | Action | Status |
| --- | --- | --- |
| **P0** | Doc truth + stakeholder value plan | **Done** (2026-05-28 reset) |
| **P0** | Run workers in prod when integrations matter | Checklist published |
| **P1** | Reference customer exit runbook | Published |
| **P1** | Phase C briefs 023–025 | PO draft |
| **P2** | 022 completion audit + E2E | **Done** |
| **P3** | Payroll DB cutover (ADR 0012) | Scaffold only — after reference exit |

---

## 7. Differentiators to preserve

1. Deterministic payroll kernel (`packages/payroll-calc/`)
2. JWT → ABAC → RLS
3. Compliance rule packs + golden vectors
4. PO-gated UAC — no checkbox features without brief

---

## 8. Document index

| Artifact | Path |
| --- | --- |
| Stakeholder value plan | [stakeholder-value-plan.md](../docs/product/stakeholder-value-plan.md) |
| Reference customer exit | [reference-customer-exit-runbook.md](../docs/product/reference-customer-exit-runbook.md) |
| Completion baseline | [codebase-completion-baseline.md](../docs/product/codebase-completion-baseline.md) |
| Archive (pre-reset) | [planning archive](../docs/_archived/planning/2026-05-28-stakeholder-reset/) |
