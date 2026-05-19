# ADR 0006: Time (attendance punches) → premium hours → pay run (spike)

**Date:** 2026-05-18  
**Status:** Accepted (spike / phase-1b earnings wire)  
**Deciders:** Orchestrator / gap-analysis implementation  
**Tags:** compliance, payroll, time

## Context

[`docs/compliance/v1-scope.md`](../../../docs/compliance/v1-scope.md) defines **pay-premiums-and-allocations-v1** for US-FED, US-CA, US-NY, US-CO, US-TX. **Attendance punches** are persisted (`AttendancePunch`) and power employee/manager time UIs, but premium allocation **does not** yet feed `runPayroll` earnings lines—creating wage-hour credibility gap vs UKG/Workday.

## Decision

1. Add **`lib/compliance/pay-premiums/`** with deterministic **`allocatePremiumHours`** from punch pairs → `{ regularMinutes, overtimeMinutes, doubletimeMinutes }` per period, keyed by `geoId` from the jurisdiction matrix (v1: **US-FED** weekly OT; **US-CA** daily+weekly simplified).
2. Add **`lib/payroll/premium-earnings-from-attendance.ts`** to load punches for an employee pay period and call the allocator (RLS-scoped queries in pay-run transaction).
3. **Wire:** when `PAYROLL_PREMIUM_FROM_ATTENDANCE=1`, `runPayroll` adds `additionalGrossLines` (`overtime_premium_1_5x`, `doubletime_premium_2x`) to the gross-to-net pipeline, persists memo + outbox event, and maps premium lines to paystub **BONUS** payout lines (ADR 0008 phase-1b).
4. Unit tests in `tests/unit/compliance/pay-premiums-allocation.test.ts` cover FLSA weekly threshold and CA daily OT without Postgres.

## Consequences

**Positive:** Clear seam for compliance engine; auditable path from punches to allocation.  
**Negative:** Paystub earnings still salary-only until phase-1b adds OT line items to pipeline input.  
**Operational:** Enable flag only in staging until Legal signs matrix v0.1.0.

## Alternatives considered

1. **Full matrix YAML loader in spike** — deferred; inline v1 rules for five geos only.
2. **Skip pay run hook; API-only** — rejected; “wire” requires orchestration entry point.
3. **Wasm/Rust worker** — rejected per deferred innovation track.

## Implementation notes

- Matrix reference: [`docs/compliance/jurisdiction-matrix-pay-premiums.yaml`](../../../docs/compliance/jurisdiction-matrix-pay-premiums.yaml)
- Invariants: [`docs/compliance/pay-premiums-constraints.md`](../../../docs/compliance/pay-premiums-constraints.md)
- Exempt workers: return `COMPLIANCE_EXEMPT_NO_OT` style zero premiums (no OT minutes).

## References

- Feature briefs 002, 008, 016
- Skill: `hr-backend-compliance`
