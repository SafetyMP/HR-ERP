# HR ERP — Competitive analysis & roadmap

**Status:** Living document (restored 2026-05-18)  
**Audience:** Product, platform engineering, finance (operate TCO), counsel (compliance tiers)  
**Phase anchor:** [`specs/alignment/decisions/0001-phase1-scope.md`](alignment/decisions/0001-phase1-scope.md) (Phase1_MVP)

This document consolidates the **multi-segment competitive benchmark** (value vs **operational cost**) and the **prioritized roadmap** referenced from compliance and product docs. Detailed TCO math lives in [`docs/product/competitive-ops-tco-worksheet.md`](../docs/product/competitive-ops-tco-worksheet.md); the executive summary is [`docs/product/competitive-benchmark-executive-brief.md`](../docs/product/competitive-benchmark-executive-brief.md).

---

## 1. Positioning statement

HR ERP is a **Phase 1 modular monolith** (Next.js + single Postgres) with **enterprise security scaffolding**, a **deterministic payroll calculation kernel**, and **strong employee/manager self-service** (Features 001–013, **85/85 UAC**). It is **not** a low-ops SMB HRIS or a Workday replacement out of the box. Competitive value is **control and extensibility**; competitive cost is **your operations team**, not the hosting bill alone.

---

## 2. Competitor segments

| Segment | Employees (typical) | Primary competitors | Buyer expects |
| --- | --- | --- | --- |
| **SMB** | 10–250 | Gusto, BambooHR | US payroll + HR in weeks; minimal IT |
| **Mid-market** | 250–5,000 | BambooHR Pro, Rippling, UKG, Paylocity | Recruiting, performance cycles, payroll ops, integrations |
| **Enterprise** | 5,000+ | Workday, SAP SuccessFactors, Oracle HCM | Global payroll, workforce planning, analytics, SI ecosystem |

**OSS peers** (similar *operate* model): OrangeHRM, Frappe HR, Sentrifugo — lower license cost, **higher** self-operate burden; weaker US statutory payroll than ADP/Gusto.

---

## 3. Feature parity matrix (HR ERP today)

Ratings for **this repository** as of the inventory date in [`docs/product/codebase-completion-baseline.md`](../docs/product/codebase-completion-baseline.md). Evidence links point to Feature briefs, ADRs, or API routes.

| Capability | HR ERP | Evidence | SMB SaaS | Mid-market | Enterprise |
| --- | --- | --- | --- | --- | --- |
| Employee self-service (pay, time, PTO, profile) | **Strong** | Briefs [001](../docs/product/feature-briefs/001-employee-paystub-self-service.md)–[007](../docs/product/feature-briefs/007-pay-history-summaries.md); routes `GET /me/paystub/current`, `/me/pto/summary`, `/me/profile`, `/me/attendance/today` | Strong | Strong | Strong |
| Manager workforce (attendance, leave, corrections) | **Partial** | [008](../docs/product/feature-briefs/008-manager-team-attendance-today.md), [011](../docs/product/feature-briefs/011-next-slate-wave2-bundle.md) | Strong | Strong | Strong |
| Payroll processing & tax filing | **Gap** | Kernel [`packages/payroll-calc`](../packages/payroll-calc/); `POST /api/v1/payroll/runs`; ADR [0005](../specs/alignment/decisions/0005-us-federal-withholding-v1.md), [0007](../specs/alignment/decisions/0007-uk-payroll-bootstrap-spike.md); no filing | Strong | Strong | Strong |
| Benefits admin (COBRA, 834, carriers) | **Gap** | [003](../docs/product/feature-briefs/003-benefits-enrollment-summary.md); design [us-benefits-cobra-aca-834.md](../docs/compliance/us-benefits-cobra-aca-834.md) | Partial | Strong | Strong |
| Recruiting / ATS | **Partial** | UI [`/manager/recruiting`](../src/app/manager/recruiting/); brief [014](../docs/product/feature-briefs/014-hiring-manager-recruiting-pipeline.md) shipped | Partial | Strong | Strong |
| Performance management | **Partial** | Cycles + goals [015](../docs/product/feature-briefs/015-performance-review-cycle-mvp.md); not full calibration | Partial | Strong | Strong |
| Learning / LMS | **Partial** | [`/employee/learning`](../src/app/employee/learning/); brief [017](../docs/product/feature-briefs/017-employee-learning-self-service.md) | Add-on | Partial | Strong |
| Payroll ops console | **Partial** | [`/hr/payroll-runs`](../src/app/hr/payroll-runs/); brief [016](../docs/product/feature-briefs/016-payroll-operations-pay-run-console.md) | N/A | Strong | Strong |
| Integrations | **Partial** | Webhooks ADR [0008](../specs/alignment/decisions/0008-tier2-gap-analysis-implementation.md); [`lib/webhooks/`](../lib/webhooks/) | Strong | Strong | Strong |
| Global / multi-country | **Gap** | L10n demos; UK spike [uk-payroll-bootstrap.md](../docs/compliance/uk-payroll-bootstrap.md) | Weak | Partial | Strong |
| Security / multi-tenant | **Strong** | [`lib/security/`](../lib/security/), RLS contract, [`middleware.ts`](../middleware.ts) | Adequate | Adequate | Strong |
| AI / people analytics | **Partial** | Churn pages; [`docs/ml/implementation-sequence.md`](../docs/ml/implementation-sequence.md) phases 1 & 3 not met | Emerging | Emerging | Strong |

### Segment verdict (product value only)

- **SMB:** **Lose** on payroll filing, benefits, time-to-value unless payroll is outsourced.
- **Mid-market:** **Closest** after Tier 1 (briefs 014–017) + Tier 2 statutory depth; **lose** today on recruiting UI, pay-run ops, performance cycles, learning, credible withholding.
- **Enterprise:** **Lose** on global HCM and SI ecosystem; **win** on license avoidance only with multi-year internal build mandate.

---

## 4. Operations benchmark (primary lens)

Validated inventory: [`docs/product/competitive-ops-inventory.md`](../docs/product/competitive-ops-inventory.md).

| Dimension | HR ERP (self-operate) | SaaS (vendor-operate) |
| --- | --- | --- |
| Cash opex (license + infra) | Lower subscription $; infra often **$500–2k/mo** at modest scale | Higher PEPM / platform fees |
| People opex | **High** — platform, payroll tax, security, integrations (often **2–4 FTE**) | Lower for standard workflows |
| Risk opex | **Higher** — statutory math, RLS, webhook secret storage (ADR 0008 TODO) | Lower for standard paths |
| Flexibility | **High** — own schema, policies, governance hooks | Configuration within product |
| Time to stable production | **Long** (Tier 1 + counsel on Tier 2) | **Weeks–months** |

### Multi-segment ops verdict

| Segment | Winner on ops cost / employee |
| --- | --- |
| SMB | **SaaS** almost always |
| Mid-market | **SaaS** unless dedicated platform team + sovereignty/customization mandate |
| Enterprise | **SaaS** on headcount; **HR ERP** only if license avoidance justifies years of engineering |

---

## 5. Roadmap tiers (funding order)

Aligned with [`docs/product/deferred-platform-track.md`](../docs/product/deferred-platform-track.md) (2026-05-18 reaffirmation): **do not** fund Phase 2 Kafka/multi-DB for competitive gap work.

### Tier 1 — Product UAC (highest value / effort)

| ID | Brief | UAC | Rationale |
| --- | --- | ---: | --- |
| 014 | [Hiring manager recruiting pipeline](../docs/product/feature-briefs/014-hiring-manager-recruiting-pipeline.md) | 8 | APIs exist; UI unlocks mid-market ATS parity |
| 015 | [Performance review cycle MVP](../docs/product/feature-briefs/015-performance-review-cycle-mvp.md) | 8 | Extends demo goals 012/013 |
| 016 | [Payroll operations pay run console](../docs/product/feature-briefs/016-payroll-operations-pay-run-console.md) | 7 | Trust gap vs UKG/Workday ops centers |
| 017 | [Employee learning self-service](../docs/product/feature-briefs/017-employee-learning-self-service.md) | 7 | Compliance training table stakes |

**Track A after Tier 1:** **115/115 UAC** (audit [`features-014-017.md`](../docs/product/completion-audits/features-014-017.md)).

### Tier 2 — Compliance & integrations (engineering + counsel)

| Item | ADR / doc | Status |
| --- | --- | --- |
| US federal withholding v1 | [0005](alignment/decisions/0005-us-federal-withholding-v1.md) | Table + golden vectors in `payroll-calc`; not IRS-certified |
| Time → premium → paystub | [0006](alignment/decisions/0006-time-to-premium-paystub-integration.md) | Phase 1b when `PAYROLL_PREMIUM_FROM_ATTENDANCE=1` |
| UK PAYE/NI bootstrap | [0007](alignment/decisions/0007-uk-payroll-bootstrap-spike.md) | Spike; not wired to `runPayroll` |
| Webhook HTTP delivery | [0008](alignment/decisions/0008-tier2-gap-analysis-implementation.md) | **Shipped** — run workers in prod |
| COBRA / ACA / 834 | [us-benefits-cobra-aca-834.md](../docs/compliance/us-benefits-cobra-aca-834.md) | Design; counsel before production |

### Tier 3 — Deferred platform & AI

| Item | Trigger | Doc |
| --- | --- | --- |
| DB per bounded context | Second deployable service staffed | [deferred-platform-track.md](../docs/product/deferred-platform-track.md) |
| Kafka + Schema Registry | Event volume / SLO breach | ADR 0001 |
| ML phases 1 & 3 | Exit criteria in [implementation-sequence.md](../docs/ml/implementation-sequence.md) | AI governance sign-off |
| Edge / pgvector / Wasm payroll | Innovation phases B–D | `hr-erp-innovation-rd` |

---

## 6. Strategic priorities (operations-first)

| Priority | Action | Ops effect |
| --- | --- | --- |
| **P0** | Run `worker:webhooks` and `worker:integrations` in staging/prod | Prevent silent integration failure |
| **P0** | Keep Phase 1 monolith until ADR trigger | Avoid 3–5× infra ops for Kafka/second DB |
| **P1** | Ship Tier 1 briefs 014–017 | Best mid-market credibility per engineering dollar |
| **P1** | Encrypt webhook secrets at rest (ADR 0008 consequence) | Reduce security incident cost |
| **P2** | Move Python churn CI smoke to nightly or path-filter | Lower PR Actions minutes |
| **P3** | Partner/embed Gusto or ADP for SMB payroll filing | Transfer statutory ops to vendor |

---

## 7. Differentiators to preserve

1. **Deterministic payroll kernel** — fingerprints, golden vectors ([`packages/payroll-calc`](../packages/payroll-calc/)).
2. **Defense-in-depth security** — JWT → ABAC → RLS ([`lib/security/`](../lib/security/)).
3. **Compliance rule packs** — [`docs/compliance/`](../docs/compliance/) matrices with product catch-up path.
4. **AI governance scaffolding** — [`docs/ai-governance/`](../docs/ai-governance/) ahead of typical SMB SaaS; ops cost if ML phases ship without exit criteria.
5. **Orchestration / CI discipline** — security scan, layered QA, agent skills — lowers long-term incident rate when used consistently.

---

## 8. Document index

| Artifact | Path |
| --- | --- |
| Validated ops inventory | [`docs/product/competitive-ops-inventory.md`](../docs/product/competitive-ops-inventory.md) |
| TCO worksheet | [`docs/product/competitive-ops-tco-worksheet.md`](../docs/product/competitive-ops-tco-worksheet.md) |
| Executive brief | [`docs/product/competitive-benchmark-executive-brief.md`](../docs/product/competitive-benchmark-executive-brief.md) |
| Completion baseline | [`docs/product/codebase-completion-baseline.md`](../docs/product/codebase-completion-baseline.md) |
