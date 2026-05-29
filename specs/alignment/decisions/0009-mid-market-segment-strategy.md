# ADR 0009: Mid-market segment strategy (US + UK build platform)

**Date:** 2026-05-18  
**Status:** Accepted  
**Tags:** product, competitive, segment

## Context

Competitive analysis ([`specs/competitive-analysis-roadmap.md`](../../specs/competitive-analysis-roadmap.md)) compared HR ERP to Gusto, BambooHR, Rippling, UKG, and Workday. Track A product UAC (**155/155**, briefs **001–022**) and Tier 2 compliance spikes are in flight; we must choose **who we sell to** and **what we refuse to build**.

## Decision

**Primary segment:** Mid-market employers **250–5,000 employees** in **US + UK** who need:

- Data sovereignty or deep customization of payroll policy and tenancy
- An existing **platform engineering + HR ops** team (accept ~2–4 FTE loaded ops vs SaaS PEPM)

**Positioning:** “Enterprise HR scaffold with credible self-service and deterministic payroll math” — **not** low-ops SMB HRIS or Workday replacement.

**Product north star (2026-05-18):** Beat the **BambooHR + separate payroll** stitched stack on unified experience and ownable pay policy — see [goal-beat-bamboohr-plus-payroll-stack.md](../../../docs/product/goal-beat-bamboohr-plus-payroll-stack.md).

| Segment | Decision |
| --- | --- |
| **SMB (10–250)** | **Do not pursue** as primary; partner/embed Gusto or ADP for filing if needed |
| **Mid-market (250–5k)** | **Pursue** — Phase B/C in [goal-beat-bamboohr-plus-payroll-stack.md](../../../docs/product/goal-beat-bamboohr-plus-payroll-stack.md) (partner filing, benefits ops, talent depth, connectors) |
| **Enterprise (5k+)** | **Defer** global HCM; engage only with explicit multi-year build mandate |

## Technical consequences

1. **Keep Phase 1 monolith** until ADR 0001 triggers (no Kafka/multi-DB for parity).
2. **Wire UK bootstrap** in `runPayroll` when `organization.jurisdictionCountry` is GB/UK (see `lib/payroll/payroll-jurisdiction.ts`).
3. **Run workers in production** — [phase1-production-checklist.md](../../docs/operations/phase1-production-checklist.md).
4. **COBRA/834** blocked on [cobra-aca-counsel-gate.md](../../docs/compliance/cobra-aca-counsel-gate.md).

## Alternatives considered

1. **SMB-first** — rejected; operate TCO and statutory burden favor SaaS.
2. **Enterprise-first** — rejected; missing global HCM and SI ecosystem.

## References

- [competitive-benchmark-executive-brief.md](../../docs/product/competitive-benchmark-executive-brief.md)
- [deferred-platform-track.md](../../docs/product/deferred-platform-track.md)
