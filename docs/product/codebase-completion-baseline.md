# Codebase completion — baseline and measurement

**Purpose:** Define how to answer “what percent complete?” without inventing a single orphan number. Aligns with the PO operating model (Feature briefs + numbered UAC).

**Last inventory:** 2026-05-09

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

**Primary product gap (prioritization):** Until additional briefs exist, **[Feature 001](./feature-briefs/001-employee-paystub-self-service.md) — employee current paystub / earnings statement self-service** is the numbered-UAC backlog for track A; treat scaffold and demo routes as platform work unless a brief ties them to UAC. Detail: **§3** and score in **§3** (currently **0%**).

---

## 2a. Canonical “agent skills” for roadmap and gap analysis

When mapping **“implemented vs still needed”** to Cursor agent guidance **for this repository**, use the **HR ERP skills** shipped in [`.cursor/skills/`](../../.cursor/skills/) (15 `SKILL.md` folders: `hr-product-owner`, `hr-erp-principal-architecture`, `hr-erp-innovation-rd`, `hr-backend-compliance`, `hr-payroll-calculation-engine`, `hr-ai-data-governance`, `hr-erp-mlops`, `hr-erp-security-identity`, `hr-erp-qa-chaos`, `hr-db-migration-state`, `hr-code-health`, `hr-erp-packaging-supply-chain`, `hr-developer-advocate`, `hr-erp-finops-swarm`, `hr-erp-collaboration-audit`).

Those skills are **orchestration and quality gates**, not interchangeable with the long **global Cursor marketplace / plugin skill list** (e.g. Vercel, Azure, Neon): the latter supports tooling choices; it does **not** substitute for the repo skill set above when sequencing HR ERP work.

---

## 2b. Orchestration bundles (conditional skills)

Delegates and PR authors should attach skills per [`.cursor/rules/orchestrator.mdc`](../../.cursor/rules/orchestrator.mdc). For **payroll math, wage/hour matrices, Compliance packs, or `docs/compliance/`** implementations, bind **`hr-backend-compliance`** (+ **agent-legal-hr-compliance** on Tasks); for **`packages/payroll-calc/`**, gross-to-net, fingerprints, **`computePayroll`**, also bind **`hr-payroll-calculation-engine`**. For **employee-facing churn/screening/scoring** or **`docs/ai-governance/`**, **`lib/governance/`**, governance APIs — bind **`hr-ai-data-governance`**; co-load **`hr-erp-mlops`** when inference routing, drift, MCP, or model serving materially changes.

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
