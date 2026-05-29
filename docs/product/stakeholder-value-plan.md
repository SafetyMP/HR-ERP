# Stakeholder value plan

**Status:** Active (single forward plan)  
**Reset date:** 2026-05-28  
**Audience:** Product, buyers, reference customers, engineering, finance  
**Supersedes:** Stale competitive roadmaps, external `~/.cursor/plans/` canon, archived future-platform docs

**Archive:** [docs/_archived/planning/2026-05-28-stakeholder-reset/](../_archived/planning/2026-05-28-stakeholder-reset/)

---

## 1. Truth baseline (as-of reset)

### Production topology

| Layer | Reality today | Target (ADR, not deployed) |
| --- | --- | --- |
| App | Next.js modular monolith | Optional service split per context |
| Database | **Single Prisma Postgres** (~82 models) | DB-per-context + Kafka ([ADR 0002](../../specs/alignment/decisions/0002-postgres-kafka-context-boundaries.md)) |
| Payroll math | `packages/payroll-calc/` + monolith Prisma | Ports scaffold ([ADR 0012](../../specs/alignment/decisions/0012-payroll-db-extraction.md)) |
| Workers | Webhooks + integrations (Redis/BullMQ) | Outbox publisher scaffold only |

**Do not describe multi-DB or Kafka as shipped** in buyer-facing materials.

### Track A — Feature UAC

| Wave | Briefs | UAC | Status | Audit |
| --- | --- | ---: | --- | --- |
| ESS + manager core | 001–013 | 85 | Met | [baseline §3](./codebase-completion-baseline.md) |
| Tier 1 mid-market | 014–017 | 30 | Met | [features-014-017](./completion-audits/features-014-017.md) |
| Phase B bundle | 018–021 | 32 | Met | [features-018-021](./completion-audits/features-018-021.md) |
| Product shell | 022 | 8 | Met | [features-022](./completion-audits/features-022.md) |
| **Cumulative** | **001–022** | **155** | **155/155 Met** | |

Brief **022** shipped in v2.7.0; completion audit [features-022](./completion-audits/features-022.md).

### Win scorecard (W1–W7)

| # | Claim | Status | Evidence |
| --- | --- | --- | --- |
| W1 | One portal (pay, time, leave, profile, benefits, learning) | **Met** | Briefs 001–007, 017; `/employee/*` shell (022) |
| W2 | Native payroll, not CSV circus | **Met** | `/hr/payroll-runs`, kernel fingerprints, paystub from same rows |
| W3 | Ownable, replayable policy | **Partial** | `packages/payroll-calc`, ADR 0005/0007; not IRS/HMRC certified |
| W4 | Enforceable tenancy | **Met** | JWT → ABAC → RLS; SCIM/integration tests |
| W5 | Hiring managers without separate ATS | **Met** | `/manager/recruiting` through offer (014, 020) |
| W6 | Integrations without Zapier for core paths | **Partial** | Webhooks + SCIM API shipped; 3 curated connectors (023–025) pending |
| W7 | Benefits operational, not PDF-only | **Partial** | Life events (019); COBRA notice PDF counsel-gated |

**Buyer demo target:** Prove **W1–W5** in ≤30 minutes without mock/demo routes.

---

## 2. Stakeholder outcomes (balanced)

| Stakeholder | Outcome | Workstreams |
| --- | --- | --- |
| **Buyer / demo** | Unified HR+payroll story without platform-preview confusion | [Executive brief](./competitive-benchmark-executive-brief.md), demo runbook, hide Track D from buyer inventory |
| **Reference customer** | Cancel BambooHR + payroll vendor for ESS + routine pay runs | [Reference customer exit runbook](./reference-customer-exit-runbook.md) |
| **Engineering** | Plans match repo; in-repo canon only | This doc, [specs/references.md](../../specs/references.md), ADR cleanup |
| **Finance / ops** | Honest TCO vs SaaS | [TCO worksheet](./competitive-ops-tco-worksheet.md) — inventory counts only updated |

---

## 3. Funded priorities (next 90 days)

### P0 — Documentation truth ✅ (this reset)

- Archive superseded plans; single forward plan (this document).
- Refresh competitive roadmap, executive brief, goal scorecard to **155 UAC / Phase B / 022**.
- [deferred-platform-track.md](./deferred-platform-track.md) Track D for API scaffolds.

### P1 — Reference customer exit (1–2 weeks)

- [reference-customer-exit-runbook.md](./reference-customer-exit-runbook.md)
- Filing via **partner handoff** from 018 JSON artifacts — no live agency e-file
- COBRA: document **workflow start** vs **notice PDF** gap ([counsel gate](../compliance/cobra-aca-counsel-gate.md))

### P2 — Phase C connectors (2–4 weeks)

| Brief | Focus |
| --- | --- |
| [023](./feature-briefs/023-scim-idp-production-hardening.md) | SCIM/OIDC production hardening |
| [024](./feature-briefs/024-payroll-partner-export-connector.md) | Payroll partner export (018 artifacts + webhooks) |
| [025](./feature-briefs/025-benefits-carrier-outbound-stub.md) | Benefits carrier outbound stub (834 deferred) |

**Target:** W6 **Partial → Met** (3 connectors with PO briefs + smoke/integration proof).

### P3 — Product polish (ongoing)

- Complete **022** UAC audit + E2E depth
- Continue `defineV1Route` + `useAuthenticatedResource` on `/api/v1/me/*`
- **Do not** fund Core HR DB extraction (ADR 0013 Proposed) or payroll cutover until reference customer exit is documented

---

## 4. Explicit non-fund (archive holds)

- Kafka / DB-per-context **production** wiring
- Production employee ML scoring ([ML sequence archived](../ml/implementation-sequence.md))
- Edge/pgvector, Wasm/Rust, PQC innovation phases
- Undocumented Track D APIs as “shipped product” (comp, workflow, engagement)

---

## 5. Success metrics

| Metric | Target |
| --- | --- |
| Doc drift | Zero “115 UAC” or “Tier 1 next” in active docs |
| Buyer demo | W1–W5 in &lt;30 min without `/mock`, `/global-l10n`, `/demo` |
| W6 | Briefs 023–025 PO-approved + integration/smoke proof |
| 022 | 8/8 UAC in completion audit |
| Agent canon | [specs/references.md](../../specs/references.md) in-repo paths only |

---

## 6. Related documents

- [goal-beat-bamboohr-plus-payroll-stack.md](./goal-beat-bamboohr-plus-payroll-stack.md) — north star
- [codebase-completion-baseline.md](./codebase-completion-baseline.md) — UAC math
- [competitive-analysis-roadmap.md](../../specs/competitive-analysis-roadmap.md) — parity matrix
- [deferred-platform-track.md](./deferred-platform-track.md) — demo + Track D
- [reference-customer-exit-runbook.md](./reference-customer-exit-runbook.md) — Phase B exit
