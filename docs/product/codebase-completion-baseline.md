# Codebase completion — baseline and measurement

**Purpose:** Define how to answer “what percent complete?” without inventing a single orphan number. Aligns with the PO operating model (Feature briefs + numbered UAC).

**Last inventory:** 2026-05-09

**Shippable vs platform:** **Track A (Feature UAC)** is the authoritative bar for “product shipped.” Routes, demos, kernels, and docs in tree that are **not** tied to an approved Feature brief’s numbered UAC count as **platform / scaffold / demo** capability — useful, but not closure of PO scope.

---

## 1. Denominators (pick one per report)

| Track | Denominator | Formula | When to use |
| --- | --- | --- | --- |
| **A — Feature UAC** | Sum of numbered UAC rows across approved Feature briefs under [`feature-briefs/`](./feature-briefs/) | `% = (UAC met ÷ UAC total) × 100`; optional **partial = 0.5** if explicitly scored | Shippable HR product progress; primary signal for this repo |
| **B — Phase architecture** | Checklist items you choose (e.g. [`docs/architecture/01-phase-a-core-boundaries.md`](../architecture/01-phase-a-core-boundaries.md)) | Manual count of satisfied items | Platform / “Phase A” readiness, not employee features |
| **C — AI platform** | Phases in [`docs/ml/implementation-sequence.md`](../ml/implementation-sequence.md) | Qualitative per phase (exit criteria met Y/N) | Inference / scoring / agents only |

**Do not use:** LOC, file counts, or vague “ERP parity” without a written backlog — they do not measure shippable value.

**Whole-repo single %:** Undefined unless you merge tracks with explicit weights (e.g. “70% weight on UAC track A, 30% on track B”). Document weights in PR or release notes if you publish a blended score.

---

## 2. Current portfolio (denominator A)

| Source | Count |
| --- | ---: |
| Feature briefs in `docs/product/feature-briefs/` | **1** |
| Total numbered UAC (that brief only) | **6** |

As briefs are added, update this table or derive counts from briefs in CI/docs automation later.

**Primary product gap (prioritization):** **[Feature 001](./feature-briefs/001-employee-paystub-self-service.md)** (employee current paystub) — backlog recap **§2e**, audit **§3**.

---

## 2a. Canonical “agent skills” for roadmap and gap analysis

When mapping **“implemented vs still needed”** to Cursor agent guidance **for this repository**, use the **HR ERP skills** shipped in [`.cursor/skills/`](../../.cursor/skills/) (15 `SKILL.md` folders: `hr-product-owner`, `hr-erp-principal-architecture`, `hr-erp-innovation-rd`, `hr-backend-compliance`, `hr-payroll-calculation-engine`, `hr-ai-data-governance`, `hr-erp-mlops`, `hr-erp-security-identity`, `hr-erp-qa-chaos`, `hr-db-migration-state`, `hr-code-health`, `hr-erp-packaging-supply-chain`, `hr-developer-advocate`, `hr-erp-finops-swarm`, `hr-erp-collaboration-audit`).

Those skills are **orchestration and quality gates**, not interchangeable with the long **global Cursor marketplace / plugin skill list** (e.g. Vercel, Azure, Neon): the latter supports tooling choices; it does **not** substitute for the repo skill set above when sequencing HR ERP work.

---

## 2b. Orchestration bundles (conditional skills)

Delegates and PR authors should attach skills per [`.cursor/rules/orchestrator.mdc`](../../.cursor/rules/orchestrator.mdc). For **payroll math, wage/hour matrices, Compliance packs, or `docs/compliance/`** implementations, bind **`hr-backend-compliance`** (+ **agent-legal-hr-compliance** on Tasks); for **`packages/payroll-calc/`**, gross-to-net, fingerprints, **`computePayroll`**, also bind **`hr-payroll-calculation-engine`**. For **employee-facing churn/screening/scoring** or **`docs/ai-governance/`**, **`lib/governance/`**, governance APIs — bind **`hr-ai-data-governance`**; co-load **`hr-erp-mlops`** when inference routing, drift, MCP, or model serving materially changes.

---

## 2c. Implemented capabilities today (engineering / platform inventory)

Point-in-time inventory of what exists **in-repo** beneath track A — **not** a claim that Feature 001 or other brief UAC rows are satisfied.

### Web application (Next.js App Router)

- **Home / pattern demos:** [`src/app/page.tsx`](../../src/app/page.tsx) — examples links, QA lab; not employee paystub IA.
- **Examples:** [`src/app/examples/`](../../src/app/examples/) — jurisdiction, onboarding, org, reporting.
- **QA lab:** [`src/app/qa-lab/page.tsx`](../../src/app/qa-lab/page.tsx).
- **Global L10n lab:** [`src/app/global-l10n/`](../../src/app/global-l10n/) — payroll splits (contractor-style demo), scheduling overlap, profile, planning/sprint capacity–adjacent demos.
- **Analytics pages:** [`src/app/analytics/churn/page.tsx`](../../src/app/analytics/churn/page.tsx), [`skills/page.tsx`](../../src/app/analytics/skills/page.tsx), [`benchmarks/page.tsx`](../../src/app/analytics/benchmarks/page.tsx) — manager-style views (`ChurnScore`, etc.).

### Versioned HTTP API (`/api/v1/*`)

Registered in [`lib/security/route-policies.ts`](../../lib/security/route-policies.ts); handlers under [`src/app/api/v1/`](../../src/app/api/v1/).

| Area | Routes |
| --- | --- |
| Core HR-ish | `GET /employees`, `GET /employees/:employeeId` |
| Attendance | `POST /attendance/clock-in` |
| Analytics | `GET /analytics/churn`, `GET /analytics/skills/match`, `GET /analytics/benchmarks` |
| ML proxy | `POST /ml/churn/score` → `ML_SERVING_URL` (default `http://127.0.0.1:8090`) |

Other surfaces (not all in route-policies): [`src/app/api/governance/proposals`](../../src/app/api/governance/proposals/route.ts) (and execute/detail variants), [`src/app/api/global-l10n/`](../../src/app/api/global-l10n/), [`src/app/api/mock/`](../../src/app/api/mock/).

### Data and payroll math

- **Prisma app DB:** [`prisma/schema.prisma`](../../prisma/schema.prisma) — tenants, employees, churn scores, payroll period / payout lines (demo contexts), etc.
- **Payroll kernel package:** [`packages/payroll-calc/`](../../packages/payroll-calc/) — deterministic pipeline + tests; **not** wired to an employee earnings-statement product flow (see **§3**).

### Security and platform

- **Auth / policies / RLS-oriented path:** [`middleware.ts`](../../middleware.ts), [`lib/security/`](../../lib/security/).
- **Workers:** outbox → Kafka publisher, BullMQ integration jobs ([`README.md`](../../README.md)).
- **Contracts:** [`contracts/openapi/`](../../contracts/openapi/), [`proto/`](../../proto/).
- **Python sidecar:** training / ETL / churn FastAPI — [`services/`](../../services/) (“Predictive HR” in README).

### Documentation (substantive; not all mirrored in product UI)

- Compliance: [`docs/compliance/`](../compliance/).
- AI governance: [`docs/ai-governance/`](../ai-governance/).
- ML rollout phases: [`docs/ml/implementation-sequence.md`](../ml/implementation-sequence.md).
- Phase topology ADR: [`specs/alignment/decisions/0001-phase1-scope.md`](../../specs/alignment/decisions/0001-phase1-scope.md) — single app + Postgres; Kafka/multi-DB deferred until ADR revisit.

### High-level map (capabilities, not bounded-context deployment)

```mermaid
flowchart LR
  subgraph ui [App_routes]
    Home[Home_and_examples]
    L10n[global-l10n_demos]
    AnalyticsUI[analytics_pages]
  end
  subgraph api [APIs]
    V1["/api/v1_core_attendance_analytics_ml"]
    Gov["/api/governance/proposals"]
  end
  subgraph data_plane [Data_and_workers]
    Prisma[(Prisma_Postgres)]
    Calc[payroll-calc_pkg]
    Workers[outbox_Kafka_BullMQ]
    Py[Python_ML_serving]
  end
  ui --> api
  api --> Prisma
  V1 --> Py
  Calc -. not_linked_to_paystub_UI .-> ui
```

---

## 2d. Repo agent skills (15) — gap lens versus inventory above

Skills live under [`.cursor/skills/*/SKILL.md`](../../.cursor/skills/). They are **orchestration lenses** applied when touching certain paths — not a second product backlog. “Still needed” means the skill stays relevant because the domain is **partially implemented** or **thin** versus production intent.

| Skill | Role | Present in codebase | Typical remaining work |
| --- | --- | --- | --- |
| [`hr-product-owner`](../../.cursor/skills/hr-product-owner/SKILL.md) | Briefs + UAC + friction | Brief **001** approved | Feature **001** end-to-end; add briefs for other ERP slices |
| [`hr-erp-principal-architecture`](../../.cursor/skills/hr-erp-principal-architecture/SKILL.md) | Contexts, buses, contracts | Phase 1 ADR + logical separation | Kafka/outbox extraction when ADR triggers |
| [`hr-erp-innovation-rd`](../../.cursor/skills/hr-erp-innovation-rd/SKILL.md) | Edge/pgvector/Wasm/Rust gates | Postgres-centered MVP | Parity notes when Edge-heavy paths land |
| [`hr-backend-compliance`](../../.cursor/skills/hr-backend-compliance/SKILL.md) | Wage/hour, `COMPLIANCE_*` | Strong **docs**; clock-in route | Executable premium/OT for **employee** paystub lines |
| [`hr-payroll-calculation-engine`](../../.cursor/skills/hr-payroll-calculation-engine/SKILL.md) | `packages/payroll-calc` | Package + tests | Persisted runs ↔ UI/API earnings statements |
| [`hr-ai-data-governance`](../../.cursor/skills/hr-ai-data-governance/SKILL.md) | HITL, XAI, governance | Proposals APIs + churn surfaces | [`PR_CHECKLIST.md`](../ai-governance/PR_CHECKLIST.md) for production scoring |
| [`hr-erp-mlops`](../../.cursor/skills/hr-erp-mlops/SKILL.md) | Inference tiering, logs, drift | Churn proxy + doc sequence | Phases in [`implementation-sequence.md`](../ml/implementation-sequence.md) |
| [`hr-erp-security-identity`](../../.cursor/skills/hr-erp-security-identity/SKILL.md) | RBAC/ABAC, RLS, CI | Baseline wired | Hardening per route/migration |
| [`hr-erp-qa-chaos`](../../.cursor/skills/hr-erp-qa-chaos/SKILL.md) | Layered tests | QA lab + [`docs/QA.md`](../QA.md) | Automated UAC coverage for shipped features |
| [`hr-db-migration-state`](../../.cursor/skills/hr-db-migration-state/SKILL.md) | Safe DDL, verify | Migrations + runbooks | Applies on every schema change |
| [`hr-code-health`](../../.cursor/skills/hr-code-health/SKILL.md) | Smell/refactor hygiene | Process skill | Runs on substantive `src`/contract edits |
| [`hr-erp-packaging-supply-chain`](../../.cursor/skills/hr-erp-packaging-supply-chain/SKILL.md) | OCI, SBOM | CI + README | Operational release tuning |
| [`hr-developer-advocate`](../../.cursor/skills/hr-developer-advocate/SKILL.md) | Contributor UX | Templates | External PR/issue handoffs |
| [`hr-erp-finops-swarm`](../../.cursor/skills/hr-erp-finops-swarm/SKILL.md) | Multi-agent cost discipline | Orchestration-only | Not a product feature gap |
| [`hr-erp-collaboration-audit`](../../.cursor/skills/hr-erp-collaboration-audit/SKILL.md) | Post-mortems | Audit-only | Not a product feature gap |

The long global **Cursor marketplace** skill list does **not** replace the 15-repo set for HR ERP sequencing (see **§2a**).

---

## 2e. Primary product backlog (track A recap)

The only numbered-UAC shipped target in portfolio **§2** is **[Feature 001](./feature-briefs/001-employee-paystub-self-service.md)** at **0%** completion (**§3** audit). Outstanding: navigation to the current earnings statement, standard payroll terminology on the stub, dedicated empty/error UX, recoverable failures without leaking stack traces, and timed QA scripts. When Implementation touches payroll, compliance matrices, kernels, churn/scoring, or governance APIs, attach skills per **§2b** and [`orchestrator.mdc`](../../.cursor/rules/orchestrator.mdc).

---

## 3. Feature 001 audit — Employee paystub self-service

**Brief:** [`001-employee-paystub-self-service.md`](./feature-briefs/001-employee-paystub-self-service.md)  
**Method:** Static review of app routes (`src/app/`), APIs (`src/app/api/`), and Prisma domain models referenced by brief scope. No production build or timed QA run in this audit.

### UAC results

| # | UAC (summary) | Status | Evidence |
| --- | --- | --- | --- |
| 1 | ≤2 intentional navigational actions after auth from default home/dashboard to current paystub | **Not met** | Home ([`src/app/page.tsx`](../../src/app/page.tsx)) links to examples, QA lab, and demos — no Pay / Paystub / Earnings affordance to a paystub view. |
| 2 | Pay period dates, gross, itemized pre-tax deductions, taxes, net pay; standard terminology | **Not met** | No employee paystub page or route under `src/app/`; `rg` across `src` finds no paystub/earnings-statement UI. Payroll demo exists at [`global-l10n/payroll/splits`](../../src/app/global-l10n/payroll/splits/page.tsx) (contractor splits), not earnings statement layout. |
| 3 | Dedicated empty state when no paystub exists | **Not met** | No paystub area; cannot evaluate empty state for this job-to-be-done. |
| 4 | Recoverable error on load failure; no stack traces/error codes for employee | **Not met** *(feature-scoped)* | Generic [`src/app/error.tsx`](../../src/app/error.tsx) offers “Try again” / home, but mentions “diagnostics below with support” and shows `error.message` in development — **not** wired to paystub fetch, and brief targets employee paystub load failures specifically. |
| 5 | Consistent “paystub” or “earnings statement” in nav and headings | **Not met** | No such navigation or headings for self-service paystub. |
| 6 | First-time path completable under 10 seconds (QA script, excl. external network) | **Not assessed / Not met** | No standardized QA script wired to this flow in-repo; flow absent, so criterion not satisfied. |

**Supporting note:** [`prisma/schema.prisma`](../../prisma/schema.prisma) includes `PayrollPeriod`, `PaymentInstruction`, and `PayoutLine` (contractor/multi-currency split context). That is **not** the same as shipping Feature 001’s employee-facing current paystub experience and UAC closure.

### Feature 001 score (track A only)

- **Met:** 0  
- **Partial:** 0  
- **Total UAC:** 6  
- **Completion:** **0%** for this Feature as of audit date.

---

## 4. Maintainer hygiene

When adding a Feature brief:

1. Increment portfolio counts in **§2** (or generate from briefs).
2. After implementation claims merge readiness, attach a filled QA plan tied to verbatim UAC ([`specs/templates/qa-plan.md`](../../specs/templates/qa-plan.md)) and update the Feature’s row in §3 or a sibling `completion-audits/` note.
