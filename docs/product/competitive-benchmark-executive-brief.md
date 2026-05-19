# Executive brief — HR ERP competitive benchmark (operations + multi-segment)

**Date:** 2026-05-18 (refreshed)  
**Audience:** Leadership, platform engineering, finance  
**Scope:** Multi-segment product comparison with **primary lens on cost to operate** (self-host scaffold vs vendor-hosted SaaS).

**Supporting artifacts:** [Validated ops inventory](./competitive-ops-inventory.md) · [TCO worksheet](./competitive-ops-tco-worksheet.md) · [Competitive roadmap](../../specs/competitive-analysis-roadmap.md) · [Phase 1 production checklist](../operations/phase1-production-checklist.md) · [ADR 0009 mid-market strategy](../../specs/alignment/decisions/0009-mid-market-segment-strategy.md)

---

## Summary

HR ERP is a **Phase 1 modular monolith** with **115/115** shipped Track A user-acceptance criteria (Features **001–017**), including Tier 1 mid-market surfaces: recruiting pipeline, performance cycle MVP, payroll pay-run console, and employee learning. It offers **strong security architecture** and a **deterministic payroll math kernel** with US federal v1 tables and a **UK PAYE/NI bootstrap path** in pay runs (engineering spikes — **not** production tax filing or HMRC RTI).

**Bottom line:** The product wins on **control, extensibility, and compliance-ready design**. It loses on **operational cost per employee** versus SaaS for almost all buyers unless you already fund a platform team. The monthly Vercel bill is not the decision driver — **engineering and compliance headcount are**.

**Primary segment (ADR 0009):** Mid-market **250–5,000 employees**, **US + UK**, build-platform buyers — not SMB low-ops or enterprise Workday replacement.

**Product goal:** Overtake the **BambooHR + separate payroll** bundle on unified experience and ownable pay policy — [goal doc](./goal-beat-bamboohr-plus-payroll-stack.md).

---

## What we ship today

| Dimension | Status |
| --- | --- |
| **Track A (001–017)** | **115/115** audited UAC — ESS, manager workforce, HR ops, recruiting UI, performance goals + cycles, pay-run console, learning self-service |
| **Tier 1 routes** | `/manager/recruiting`, `/manager/team-performance`, `/hr/payroll-runs`, `/employee/learning` (see [completion audit](./completion-audits/features-014-017.md)) |
| **Payroll** | Deterministic kernel; `runPayroll` uses US federal v1 by default; **GB/UK** orgs use PAYE/NI bootstrap deductions; **no** IRS/HMRC filing |
| **Integrations** | Webhook HTTP delivery (ADR 0008); connector RFC drafted ([vendor-connector-rfc.md](../integrations/vendor-connector-rfc.md)) |
| **Production topology** | Vercel (`iad1`) + one Postgres + Redis; **separate workers** for webhooks and integrations |
| **Deferred** | Kafka, DB-per-context, production ML (per ADRs and ML sequence) |

---

## Competitive position by segment

### SMB (10–250 employees)

| | HR ERP | Gusto / BambooHR |
| --- | --- | --- |
| **Value** | Customizable monolith; weak payroll filing and benefits | Fast US HR + payroll; employees adopt the portal |
| **Operate cost** | High — minimum platform attention + payroll partner | Low — vendor runs tax updates and filings |
| **Verdict** | **Do not position** as low-ops SMB HRIS | **Default buy** for cost and time-to-value |

### Mid-market (250–5,000 employees)

| | HR ERP | Rippling / UKG / BambooHR Pro |
| --- | --- | --- |
| **Value** | Credible ESS + partial talent/payroll ops; gaps in benefits admin, integration catalog, statutory filing | Full modules and integrations |
| **Operate cost** | Illustrative **~$38/employee/month** TCO at 500 EE vs **~$14** SaaS | Dominated by vendor ops, not infra |
| **Verdict** | **Viable build platform** with Tier 2 statutory + connectors **if** sovereignty/customization justifies investment | **Default buy** for predictable ops |

### Enterprise (5,000+ employees)

| | HR ERP | Workday / SAP |
| --- | --- | --- |
| **Value** | No global HCM, workforce planning, or SI ecosystem | Deep analytics and global compliance |
| **Verdict** | **Not a near-term replacement** | Incumbent unless strategic sovereignty mandate |

---

## Operations: what you must run

See [phase1-production-checklist.md](../operations/phase1-production-checklist.md):

1. **Vercel** — Next.js app; Production env (`JWT_SECRET`, `DATABASE_URL`, optional OIDC).
2. **Postgres** — Single database; `db:verify` after migrate.
3. **Redis + workers** — `npm run worker:webhooks` and `npm run worker:integrations` (required when integrations matter).
4. **CI** — Layered gate; Python churn smoke **path-filtered** on PRs (see [competitive-ops-inventory.md](./competitive-ops-inventory.md)).
5. **Counsel** — Own wage/hour and tax table releases; COBRA/834 gated ([cobra-aca-counsel-gate.md](../compliance/cobra-aca-counsel-gate.md)).

---

## Recommendations (current)

| Priority | Action | Status |
| --- | --- | --- |
| **P0** | Production checklist (workers, Redis, OIDC) | Checklist published |
| **P0** | Hold Phase 1 monolith until ADR trigger | Unchanged |
| **P1** | Tier 1 briefs 014–017 | **Shipped** (115/115 UAC) |
| **P1** | Tier 2 statutory depth + counsel | In progress (US v1 wired; UK bootstrap in `runPayroll`; COBRA counsel gate) |
| **P1** | Webhook secret encryption | ADR 0008 follow-up |
| **P2** | Vendor connector RFC + module depth | RFC + CSV export, reject pipeline, learning filters |
| **P3** | SMB: partner payroll filing | Strategy doc ADR 0009 |

---

## Conclusion

HR ERP is an **enterprise HR scaffold with credible Phase 1–Tier 1 self-service**, approaching mid-market credibility on talent and payroll ops surfaces while **still behind** SaaS on statutory filing, benefits carriers, and integration breadth. SaaS wins **operate cost per employee** for most buyers; HR ERP wins when a **platform team** needs **deep control** over payroll logic, tenancy, and governance ([roadmap](../../specs/competitive-analysis-roadmap.md)).
