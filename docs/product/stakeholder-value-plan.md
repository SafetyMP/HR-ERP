# Stakeholder value plan

**Status:** Active (single forward plan)  
**Reset date:** 2026-05-28  
**Audience:** Product, buyers, reference customers, engineering, finance  
**Supersedes:** Stale competitive roadmaps, external `~/.cursor/plans/` canon, archived future-platform docs

**Open source framing:** This plan tracks **shippable product depth and buyer-ready gates** inside an **evergreen reference repo** — not a claim that the public OSS tree is a certified payroll vendor. See [evergreen-open-source-positioning.md](../meta/evergreen-open-source-positioning.md).

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

### Track A extension — briefs 023–028 (separate UAC audits)

Not merged into the **155** Track A denominator unless PO re-baselines. Status from completion audits:

| Briefs | Theme | Status | Audit |
| --- | --- | --- | --- |
| 023–025 | Phase C connectors (SCIM, partner export, carrier stub) | **Met** | [features-023-025](./completion-audits/features-023-025.md) |
| 026 | Benefits election change intent (W7 UX) | **Shipped** | [features-026](./completion-audits/features-026.md) |
| 027 | COBRA notice PDF | **Blocked** (counsel gates 1–4) | [features-027](./completion-audits/features-027.md) |
| 028 | Partner filing UX + counsel package (W3) | **Shipped** (UX; counsel signoff pending) | [features-028](./completion-audits/features-028.md) |

### Win scorecard (W1–W7)

| # | Claim | Status | Evidence |
| --- | --- | --- | --- |
| W1 | One portal (pay, time, leave, profile, benefits, learning) | **Met** | Briefs 001–007, 017; `/employee` home + `/employee/*` shell (022) |
| W2 | Native payroll, not CSV circus | **Met** | `/hr/payroll-runs`, kernel fingerprints, paystub from same rows |
| W3 | Ownable, replayable policy | **Partial** | `packages/payroll-calc`, ADR 0005/0007; not IRS/HMRC certified |
| W4 | Enforceable tenancy | **Met** | JWT → ABAC → RLS; SCIM/integration tests |
| W5 | Hiring managers without separate ATS | **Met** | `/manager/recruiting` through offer (014, 020) |
| W6 | Integrations without Zapier for core paths | **Met** | SCIM hardened (023), partner export (024), carrier stub (025) |
| W7 | Benefits operational, not PDF-only | **Partial** | Life events (019); election intent (026); COBRA PDF blocked (027) |

**Buyer demo target:** Prove **W1–W5** in ≤30 minutes without mock/demo routes.

### Track B — Buyer-ready OKRs (distinct from UAC)

Track A **155/155** measures **feature audit closure**. Track B measures **reference-customer and buyer-perceived** readiness.

| OKR | Target | Evidence |
| --- | --- | --- |
| Reference exit signed | 1 customer appendix complete | [reference-customer-exit-appendix-template.md](./reference-customer-exit-appendix-template.md) + `npm run verify:reference-exit` |
| ESS friction | Top-5 tasks within scorecard budgets (**required** gate) | [ess-friction-scorecard.md](./ess-friction-scorecard.md) + `tests/e2e/ess-friction-budgets.spec.ts` |
| W3 counsel | `w3_counsel_signoff_date` recorded | [counsel-track-w3-w7.md](./counsel-track-w3-w7.md) + [us-federal-withholding-placeholder.md](../compliance/us-federal-withholding-placeholder.md) |
| W7 COBRA | `w7_cobra_notice_state` = `workflow_only` until 027 | [cobra-aca-counsel-gate.md](../compliance/cobra-aca-counsel-gate.md) |
| Honest demo | Zero Track D / mock / global-l10n in buyer script | [deferred-platform-track.md](./deferred-platform-track.md) |

### Track C — Engineering health

| OKR | Target | Evidence |
| --- | --- | --- |
| `/api/v1/me/*` reads | `defineV1Route` + shared query hooks | `src/lib/*/use-*-query.ts` |
| lib boundaries | No forbidden cross-imports | `npm run check:lib-boundaries` |
| Track D prod | 404 unless `TRACK_D_API_ENABLED=1` | `lib/api/v1/track-d-guard.ts` |

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

### P2 — Phase C connectors ✅

| Brief | Focus |
| --- | --- |
| [023](./feature-briefs/023-scim-idp-production-hardening.md) | SCIM/OIDC production hardening — [audit](./completion-audits/features-023-025.md) |
| [024](./feature-briefs/024-payroll-partner-export-connector.md) | Payroll partner export — [audit](./completion-audits/features-023-025.md) |
| [025](./feature-briefs/025-benefits-carrier-outbound-stub.md) | Benefits carrier outbound stub — [audit](./completion-audits/features-023-025.md) |

**Complete:** W6 **Met** — [features-023-025](./completion-audits/features-023-025.md).

### P3 — Track B buyer-ready (ongoing)

- [reference-customer-exit-runbook.md](./reference-customer-exit-runbook.md) + `npm run verify:reference-exit` — signed appendix for ≥1 reference customer
- [ess-friction-scorecard.md](./ess-friction-scorecard.md) — Playwright budgets for top-5 ESS (**required** exit gate)
- Brief **026** election change intent — **shipped** — [features-026](./completion-audits/features-026.md)
- Brief **028** partner filing UX — **shipped** — [features-028](./completion-audits/features-028.md); record `w3_counsel_signoff_date` via [counsel-track-w3-w7.md](./counsel-track-w3-w7.md)
- Brief **027** COBRA notice PDF — **blocked** on counsel gates — [features-027](./completion-audits/features-027.md)
- `defineV1Route` + shared query hooks on `/api/v1/me/*` reads — largely complete
- [lib-module-boundaries.md](../architecture/lib-module-boundaries.md) + `npm run check:lib-boundaries`
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
| **Track B** reference exit | Signed appendix for ≥1 reference customer |
| **Track B** friction | ESS scorecard **required** for reference exit; green in CI when JWT provided |
| Buyer demo | W1–W5 in &lt;30 min without `/mock`, `/global-l10n`, `/demo`, Track D |
| W6 | Briefs 023–025 PO-approved + integration/smoke proof | **Met** — [features-023-025](./completion-audits/features-023-025.md) |
| 022 | 8/8 UAC in completion audit |
| 026 / 028 | Shipped per completion audits (not in 155 denominator) |
| 027 | Blocked until counsel gates — `w7_cobra_notice_state` = `workflow_only` |
| **Track C** lib boundaries | `check:lib-boundaries` in CI |
| Agent canon | [specs/references.md](../../specs/references.md) in-repo paths only |

---

## 6. Related documents

| Track | Documents |
| --- | --- |
| **North star** | [goal-beat-bamboohr-plus-payroll-stack.md](./goal-beat-bamboohr-plus-payroll-stack.md) |
| **Track A (155 UAC)** | [codebase-completion-baseline.md](./codebase-completion-baseline.md) · [completion-audits/README.md](./completion-audits/README.md) |
| **Phase C / 023–028** | [completion-audits/features-023-025.md](./completion-audits/features-023-025.md) · [features-026.md](./completion-audits/features-026.md) · [features-027.md](./completion-audits/features-027.md) · [features-028.md](./completion-audits/features-028.md) |
| **Track B exit** | [reference-customer-exit-runbook.md](./reference-customer-exit-runbook.md) · [ess-friction-scorecard.md](./ess-friction-scorecard.md) · [counsel-track-w3-w7.md](./counsel-track-w3-w7.md) |
| **Platform / demo** | [deferred-platform-track.md](./deferred-platform-track.md) · [competitive-analysis-roadmap.md](../../specs/competitive-analysis-roadmap.md) |
