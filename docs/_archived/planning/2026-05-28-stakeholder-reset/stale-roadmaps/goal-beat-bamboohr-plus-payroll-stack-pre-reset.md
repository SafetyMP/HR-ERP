# Product goal: Beat the stitched mid-market stack (BambooHR + payroll)

**Status:** Active north star (product)  
**Set:** 2026-05-18  
**Competitive anchor:** [Competitive analysis §2 — selective mid-market overtake](../../specs/competitive-analysis-roadmap.md)  
**Segment:** [ADR 0009](../alignment/decisions/0009-mid-market-segment-strategy.md) — mid-market 250–5k, US + UK, build platform buyers

---

## North star

Deliver a **single employee and HR experience** that is **clearly better** than running **BambooHR (or equivalent core HRIS) plus a separate payroll provider** (Paylocity, ADP, Gusto Payroll, etc.) — for buyers who will pay an **elevated platform price** for **one system of record, ownable payroll policy, and defense-in-depth tenancy**.

**We are not optimizing to beat BambooHR on lowest PEPM or fastest SMB go-live.** We win when the buyer would otherwise pay for **two (or three) products plus integration tax**.

---

## Reference competitor bundle

| Layer | Typical vendor | What “better” means for us |
| --- | --- | --- |
| Core HR + ESS | BambooHR, Namely, HiBob (US) | One login; ≤2 clicks to pay, time, PTO, profile, benefits; manager workforce in same app |
| Payroll execution | Paylocity, ADP, Rippling Payroll | Pay runs, period detail, earnings lines, and replayable math **in-app** — filing via **partner** acceptable |
| Light talent | BambooHR hiring add-on, Greenhouse (separate) | Requisition → pipeline → offer **without** a third login for hiring managers |
| Integrations | Zapier + iPaaS glue | First-party webhooks **plus** ≥3 curated connectors (see Phase C) |

---

## Win definition (buyer-verifiable)

A prospect should agree with **all** of the following after a 30-minute demo + security review:

| # | Claim | Evidence bar |
| --- | --- | --- |
| W1 | **One portal** for employee pay, time, leave, profile, benefits, learning | Track A routes 001–007, 017; home hub |
| W2 | **Payroll is native**, not a CSV export circus | `/hr/payroll-runs`, kernel fingerprints, paystub from same `PaymentInstruction` rows |
| W3 | **Policy is ours** — replayable, versioned, counsel-path documented | `packages/payroll-calc`, ADR 0005/0007, compliance packs |
| W4 | **Tenancy is enforceable**, not config-only | RLS + ABAC demo; no cross-tenant IDOR in QA |
| W5 | **Hiring managers don’t need a separate ATS** for standard reqs | `/manager/recruiting` through offer (014+ depth) |
| W6 | **Integration is outbound + inbound without Zapier for core paths** | Webhooks shipped; Phase C connectors live |
| W7 | **Benefits are operational**, not a PDF summary only | Phase B election + COBRA path (counsel-gated) |

**Product “overtake” = W1–W5 today (partial on W5 depth), W6–W7 on roadmap below.**

---

## Scorecard (today vs target)

| Dimension | vs BambooHR alone | vs BambooHR + payroll | Target by |
| --- | --- | --- | --- |
| Employee ESS | **Parity / win** on security story | **Win** (unified pay data) | **Met** (115 UAC) |
| Manager workforce | Near parity | **Win** (same app as pay) | **Met** |
| Payroll ops | Gap (they partner) | **Parity** (console); **gap** filing | Phase B partner |
| Benefits | Gap | **Gap** | Phase B |
| Recruiting | Behind Pro ATS | **Win** vs no ATS / **lose** vs Greenhouse | Phase B depth |
| Performance | Behind full suite | **Win** vs goals-only add-ons | Phase B |
| Integrations | Behind | **Gap** | Phase C |
| Admin analytics | Behind | **Gap** | Phase C |

---

## Phased product plan (funding order)

### Phase A — **Met** (Track A 001–017 + Tier 2 spikes)

- Unified ESS, manager ops, HR queue  
- Recruiting MVP, performance cycle MVP, pay-run console, learning self-service  
- US withholding v1 + UK bootstrap in `runPayroll`; webhooks  

**Do not re-fund Phase A except regression and depth called out below.**

### Phase B — **Beat the bundle** (next product waves)

Each wave needs a Feature brief with PO gate + UAC before build.

| Wave | Outcome vs stitched stack | Suggested brief slug | Deps |
| --- | --- | --- | --- |
| **B1 Payroll trust** | **In-house** period lock, exception queue, audit export, filing **artifact** JSON (not live agency e-file) | `018-in-house-payroll-close-and-filing-artifacts` | Counsel on transmission |
| **B2 Benefits ops** | Open enrollment + life event **beyond summary**; COBRA workflow start (counsel) | `019-benefits-life-events-mvp` | [cobra-aca-counsel-gate](../compliance/cobra-aca-counsel-gate.md) |
| **B3 Talent depth** | Recruiting: interview loop + scorecard; Performance: review form + sign-off | `020-talent-depth-wave` | 014, 015 |
| **B4 HR intelligence** | Headcount, turnover, time-to-hire dashboards (no black-box scoring in prod) | `021-hr-ops-dashboards` | Reporting APIs |

**Exit criteria for Phase B:** A reference customer can **cancel BambooHR + payroll vendor portal access** for ESS and routine pay runs (filing still via partner), with written runbooks.

### Phase C — **Defensible moat** (integrations + scale)

| Wave | Outcome | Artifact |
| --- | --- | --- |
| **C1 Connectors** | IdP (OIDC/SCIM), payroll partner, benefits carrier — implement [vendor-connector-rfc](../integrations/vendor-connector-rfc.md) | 3 shipped connectors |
| **C2 Scale** | 2k+ employees on one tenant; perf SLOs documented | Load test + ADR if Kafka trigger |

### Explicit non-goals (even for this goal)

- Beating **Gusto** on SMB low-ops payroll  
- Beating **Rippling** on integration catalog breadth without Phase C  
- **Workday-class** global HCM, workforce planning, compensation modeling  
- Production **ML scoring** on employees without ML sequence + AI governance exit  

---

## Differentiators to **never** trade away

1. Deterministic payroll kernel + fingerprints (`packages/payroll-calc`)  
2. JWT → ABAC → RLS (`lib/security/`)  
3. Compliance rule packs in `docs/compliance/` with golden vectors  
4. PO-gated UAC — no “feature checkbox” without brief  

---

## How PO scores “better than 2”

For each Phase B/C brief, PO adds one row to the brief:

| Stitched-stack pain | Our outcome | UAC proves it |
| --- | --- | --- |
| (e.g. “Payroll admin logs into ADP for every correction”) | (e.g. “Exception queue in `/hr/payroll-runs`”) | (numbered UAC) |

**Quarterly review:** Update scorecard in this doc; link completion audit path in [codebase-completion-baseline.md](./codebase-completion-baseline.md).

---

## Related documents

- [competitive-benchmark-executive-brief.md](./competitive-benchmark-executive-brief.md)  
- [specs/competitive-analysis-roadmap.md](../../specs/competitive-analysis-roadmap.md)  
- [deferred-platform-track.md](./deferred-platform-track.md)  
- [vendor-connector-rfc.md](../integrations/vendor-connector-rfc.md)
