# Feature brief: HR & payroll intake — employee-submitted case note

**ID:** 010-hr-payroll-intake-note  
**Status:** Implemented (MVP) · **Last updated:** 2026-05-09  

## PO gate

| Item | Answer |
|------|--------|
| **Primary user** | Employee needing payroll/benefits help without knowing HR’s internal tooling. |
| **Job-to-be-done** | Submit a **categorized note** that lands as an auditable **OPEN** request for HR Operations. |
| **Pain today** | Random Slack threads lose context; no structured intake in product. |
| **Outcome** | Better triage metadata (topic + body) while keeping humans in the loop. |
| **Out of scope (v1)** | SLA timers, auto-routing rules, attachments, chat integrations, public ticket IDs in UI. |

## User acceptance criteria

1. Employee reaches **HR request** from home in **≤2 navigational actions**.
2. **Topic** select includes Payroll / Benefits / Other HR (aligned with enum).
3. **Body** minimum length enforced server-side; warns against sensitive identifiers in placeholder copy.
4. Success confirmation **plain-language** — no ticket numbers required in v1.
5. Validation failures stay generic for employees (no schema dumps).
6. Demo seed includes at least one row for DB verification (optional visibility in admin UI later).

## Friction checks

- Clarify **not for emergencies** (manager / published hotline).
