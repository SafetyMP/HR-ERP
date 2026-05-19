# Feature brief: HR operations dashboard

**ID:** 021-hr-ops-dashboards  
**Status:** PO approved  
**Last updated:** 2026-05-18  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | HR operations lead or HR Director needing a single landing view. |
| **Job-to-be-done** | See **headcount**, **open reqs**, **payroll exceptions**, and **pending life events** without exporting to spreadsheets. |
| **Pain today** | Metrics scattered across routes; BambooHR offers built-in analytics. |
| **Outcome** | One HR home for operational health; deep links into payroll, recruiting, benefits queues. |
| **Scope boundary** (explicitly out of scope) | ML churn scores in production, custom report builder, executive compensation analytics. |

---

## User acceptance criteria (UAC)

1. HR user opens **HR dashboard** from home in **≤2 clicks** (`/hr/dashboard`).
2. Dashboard shows **active headcount** and **open requisition count** from `GET /api/v1/hr/analytics/ops-summary`.
3. Dashboard shows **open payroll exceptions** and **periods awaiting lock** with link to pay runs.
4. Dashboard shows **pending life events** count with link to life-event queue.
5. Dashboard shows **median time-to-hire** (days) when hire data exists, or em dash when not.
6. **403** for employee-only principals—plain language.
7. Recoverable load failures offer **retry**.
8. All figures refresh via explicit **Reload** control.

---

## Friction checks

- **Task-time target:** HR lead spots open payroll exceptions in **under 10 seconds** on dashboard load.
