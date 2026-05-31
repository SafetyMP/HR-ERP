# Executive brief — HR ERP competitive benchmark

**Date:** 2026-05-28 (stakeholder reset)  
**Audience:** Leadership, platform engineering, finance  
**Forward plan:** [stakeholder-value-plan.md](./stakeholder-value-plan.md)

**Supporting artifacts:** [ops inventory](./competitive-ops-inventory.md) · [TCO worksheet](./competitive-ops-tco-worksheet.md) · [competitive roadmap](../../specs/competitive-analysis-roadmap.md) · [reference customer exit](./reference-customer-exit-runbook.md)

---

## Summary

HR ERP is a **Phase 1 modular monolith** with **155/155 UAC** across Features **001–022**. It delivers unified ESS, manager workforce, HR/payroll ops, recruiting through offer, performance cycles, pay-run console with period lock, benefits life events, HR ops dashboard, and product shell — with **strong security** and a **deterministic payroll kernel** (US v1 + UK bootstrap spikes; **not** production tax filing).

**Bottom line:** Wins on **control, unified portal, and compliance-ready design**. Loses on **operate cost per employee** vs SaaS unless the buyer funds a platform team. **Mid-market 250–5k** is the target segment ([ADR 0009](../../specs/alignment/decisions/0009-mid-market-segment-strategy.md)).

---

## What we ship today

| Dimension | Status |
| --- | --- |
| **Track A (001–022)** | **155/155** audited UAC |
| **Track B (buyer-ready)** | Reference exit + friction + W3/W7 counsel — [stakeholder plan §1b](./stakeholder-value-plan.md) |
| **Phase B (018–021)** | Payroll close, life events, talent depth, HR dashboard — [audit](./completion-audits/features-018-021.md) |
| **Payroll** | In-app pay runs + lock + filing JSON artifact; partner handoff — no IRS/HMRC e-file |
| **Integrations** | Webhooks (ADR 0008) + SCIM API; Phase C connectors **023–025** next |
| **Production topology** | Vercel + **one Postgres** + Redis workers |
| **Deferred** | Kafka, multi-DB, production ML, Track D API scaffolds |

---

## Win scorecard (buyer demo)

| Claim | Status |
| --- | --- |
| W1 One portal | **Met** |
| W2 Native payroll | **Met** |
| W3 Ownable policy | **Partial** (counsel path documented) |
| W4 Enforceable tenancy | **Met** |
| W5 No separate ATS | **Met** |
| W6 Integrations | **Met** |
| W7 Benefits ops | **Partial** (life events; COBRA PDF counsel-gated) |

**30-minute demo:** Cover **W1–W5** without `/mock`, `/demo`, or `/global-l10n` routes.

---

## Competitive position (mid-market)

| | HR ERP | Rippling / UKG / BambooHR + payroll |
| --- | --- | --- |
| **Value** | Unified portal + in-app pay runs + light ATS | Full modules, filing, carrier integrations |
| **Operate cost** | Higher self-operate (platform team) | Lower vendor-operated PEPM |
| **Verdict** | **Viable build platform** with Phase C + partner filing | **Default buy** for predictable ops |

---

## Recommendations (current)

| Priority | Action | Status |
| --- | --- | --- |
| **P0** | Stakeholder value plan + doc reset | **Done** |
| **P0** | Production checklist (workers, OIDC) | Published |
| **P1** | Reference customer exit runbook | Published |
| **P1** | Briefs 023–025 (connectors) | **Shipped** — [audit](./completion-audits/features-023-025.md) |
| **P2** | 022 completion audit + E2E depth | **Done** |
| **P3** | Payroll DB cutover | After reference exit |

---

## Conclusion

HR ERP is a **credible mid-market HR+payroll platform** for buyers replacing a **stitched BambooHR + payroll stack**. Remaining gaps: **partner filing certification**, **full COBRA/carrier flows**, and **connector catalog** — not core ESS or pay-run mechanics.

See [stakeholder-value-plan.md](./stakeholder-value-plan.md) for funded priorities.
