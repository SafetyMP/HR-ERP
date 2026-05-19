# Executive brief — HR ERP competitive benchmark (operations + multi-segment)

**Date:** 2026-05-18  
**Audience:** Leadership, platform engineering, finance  
**Scope:** Multi-segment product comparison with **primary lens on cost to operate** (self-host scaffold vs vendor-hosted SaaS).

**Supporting artifacts:** [Validated ops inventory](./competitive-ops-inventory.md) · [TCO worksheet](./competitive-ops-tco-worksheet.md) · [Competitive roadmap](../../specs/competitive-analysis-roadmap.md)

---

## Summary

HR ERP is a **Phase 1 modular monolith** that has closed **85/85** shipped user-acceptance criteria for employee and manager self-service (Features 001–013). It offers **strong security architecture** and a **testable payroll math kernel**, but **does not** today deliver production statutory payroll filing, full benefits administration, or mid-market modules (recruiting UI, pay-run console, performance cycles, learning) that buyers expect from Rippling, UKG, or BambooHR at scale.

**Bottom line:** The product wins on **control, extensibility, and compliance-ready design**. It loses on **operational cost per employee** versus SaaS for almost all buyers unless you already fund a platform team or have a multi-year build mandate. The monthly Vercel bill is not the decision driver — **engineering and compliance headcount are**.

---

## What we ship today

| Dimension | Status |
| --- | --- |
| **Track A (001–013)** | **100%** of 85 audited UAC — paystub, time, PTO, profile, benefits summary, onboarding, HR cases, manager attendance/leave, HR review queue |
| **Approved backlog (014–017)** | **30 UAC** not built — recruiting UI, performance cycles, payroll ops console, learning self-service |
| **Payroll** | Deterministic kernel + pay runs API; US wage-bracket v1 and UK bootstrap **not** production statutory engines |
| **Production topology** | Vercel (`iad1`) + one Postgres + optional Redis; **separate workers** for webhooks and integrations |
| **Deferred** | Kafka, DB-per-context, production ML (per ADRs and ML sequence) |

---

## Competitive position by segment

### SMB (10–250 employees)

| | HR ERP | Gusto / BambooHR |
| --- | --- | --- |
| **Value** | Customizable monolith; weak payroll filing and benefits | Fast US HR + payroll; employees adopt the portal |
| **Operate cost** | High — minimum platform attention + payroll partner | Low — vendor runs tax updates and filings |
| **Verdict** | **Do not position** as low-ops SMB HRIS | **Default buy** for cost and time-to-value |

**Exception:** ISVs embedding HR into another product may accept higher ops for API and schema ownership.

### Mid-market (250–5,000 employees)

| | HR ERP | Rippling / UKG / BambooHR Pro |
| --- | --- | --- |
| **Value** | Strong ESS; gaps in recruiting UI, pay-run ops, performance cycles, learning | Full modules and integrations |
| **Operate cost** | Illustrative **~$38/employee/month** TCO at 500 EE (see worksheet) vs **~$14** SaaS — dominated by **~2–4 FTE** equivalent, not infra |
| **Verdict** | Viable **build platform** after Tier 1 (briefs 014–017) + Tier 2 statutory work **if** customization or data sovereignty justifies years of investment | **Default buy** for predictable ops |

### Enterprise (5,000+ employees)

| | HR ERP | Workday / SAP |
| --- | --- | --- |
| **Value** | No global HCM, workforce planning, or SI ecosystem | Deep analytics and global compliance |
| **Operate cost** | License savings possible at scale; **large internal program** required | High license, lower buyer engineering headcount |
| **Verdict** | **Not a near-term replacement** | Incumbent unless strategic sovereignty mandate |

---

## Operations: what you must run

Validated against live config ([inventory](./competitive-ops-inventory.md)):

1. **Vercel** — Next.js app; Production env from dashboard (JWT, `DATABASE_URL`).
2. **Postgres** — Single database; RLS migrations and `db:verify` in CI.
3. **Redis + workers** — `worker:webhooks` and `worker:integrations` for Tier 2 integrations (not optional in prod if webhooks matter).
4. **CI gate** — On every PR and `main`: lint, security scan, build, unit tests, **2× Vitest shards**, Postgres integration tests, Playwright e2e, Python churn smoke.
5. **Counsel + compliance** — You own wage/hour rule packs and tax table releases; vendors ship SOC 2 and statutory updates.

**Do not** provision Kafka or split databases for competitive catch-up alone — ADR 0001/0004 defer until operational triggers; early adoption **multiplies** ops burden with little product gain today.

---

## Value vs cost (one table)

| | Self-operate (HR ERP) | Vendor-operate (SaaS) |
| --- | --- | --- |
| **Cash** | Lower subscription | Higher PEPM |
| **People** | **Higher** | Lower |
| **Risk** | **Higher** (statutory, security config) | Lower for standard workflows |
| **Flexibility** | **Higher** | Lower |
| **Time to production** | **Long** | **Short** |

---

## Recommendations

| Priority | Action |
| --- | --- |
| **P0** | Document prod checklist: workers + Redis + webhook drain |
| **P0** | Hold Phase 1 monolith until ADR trigger for Kafka/multi-DB |
| **P1** | Fund Feature briefs **014–017** (UI on existing APIs) — best credibility per dollar |
| **P1** | Encrypt webhook secrets at rest (ADR 0008 follow-up) |
| **P2** | Reduce CI cost: nightly or path-filtered Python churn smoke |
| **P3** | SMB segment: partner/embed payroll filing rather than build ADP-class engine |

---

## Funding guidance

| Fund | Do not fund (yet) |
| --- | --- |
| Tier 1 product UAC (014–017) | Kafka / second Postgres for “competitive parity” |
| Tier 2 compliance (0005–0007, counsel) | Production ML without ML sequence exit criteria |
| Worker hosting in prod | Full Workday-class global HCM scope |

---

## Conclusion

HR ERP is best understood as an **enterprise HR scaffold with credible Phase 1 self-service**, not a finished mid-market HRIS. Against Gusto, BambooHR, Rippling, and Workday, it trades **vendor-absorbed operations** for **ownership of data, policy, and math**. For most segments, **SaaS wins on operate cost per employee**; HR ERP wins when the organization **already pays** for a platform team and needs **deep control** over payroll logic, tenancy, and governance — and accepts a **multi-year** product and compliance roadmap ([roadmap](../../specs/competitive-analysis-roadmap.md)).
