# Feature brief: Manager — team attendance today

**ID:** 008-manager-team-attendance-today  
**Status:** Implemented (MVP) · **Last updated:** 2026-05-09  

## PO gate

| Item | Answer |
|------|--------|
| **Primary user** | Frontline manager covering attendance hygiene before escalation. |
| **Job-to-be-done** | See **today’s punch summary** for **direct reports** (clocked in yes/no, punch count) without exporting reports. |
| **Pain today** | Employees use **Time** self-service; managers lack same-day visibility in product. |
| **Outcome** | Earlier coaching / HR escalation with fewer surprise absences. |
| **Out of scope (v1)** | Editing punches, approvals, exception workflows, multi-week analytics. |

## User acceptance criteria

1. Manager-authenticated user opens **Team attendance** from home in **≤2 clicks**.
2. Each **direct report** appears once with **local calendar date** + timezone label consistent with attendance logic.
3. Shows **clocked in** boolean derived from punches **today** in that timezone.
4. **403 / friendly copy** when principal lacks manager capability (employee JWT).
5. **Empty direct-report list** explains HR hierarchy may not be wired yet.
6. Recoverable load failures with retry — no internal codes in UI.

## Friction checks

- Page readable without workforce-management training manual.
