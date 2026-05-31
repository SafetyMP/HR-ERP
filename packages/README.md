# `packages/` — workspace libraries

| Package | Path | Role |
| --- | --- | --- |
| **@hr-erp/payroll-calc** | [`payroll-calc/`](payroll-calc/) | Deterministic gross-to-net kernel; consumed by `lib/payroll/` |

Install and test from repo root: `npm run test:payroll`.

Bounded-context **SQL migrations** for future splits live under [`services/`](../services/) (not npm workspaces today).
