# `lib/` module boundaries (modular monolith)

**Status:** Active  
**Phase:** Single Prisma Postgres ([ADR 0001](../../specs/alignment/decisions/0001-phase1-scope.md)) — boundaries are **import discipline**, not separate databases.

**Enforcement:** `npm run check:lib-boundaries`

---

## Context folders (owners)

| Folder | Owns | May import from |
| --- | --- | --- |
| `lib/payroll/` | Pay runs, filing artifacts, statutory wiring | `packages/payroll-calc`, `lib/security`, `lib/db` — **not** `lib/recruiting` |
| `lib/benefits/` | Enrollments, life events, election intents | `lib/security`, `lib/db` — **not** `lib/payroll` writes |
| `lib/attendance/` | Punches, today summary, corrections | `lib/security`, `lib/db` |
| `lib/pto/`, `lib/time-off/` | PTO balances, leave requests | `lib/security`, `lib/db` |
| `lib/recruiting/` | Requisitions, applications, offers | `lib/security`, `lib/db` |
| `lib/performance/` | Goals, reviews | `lib/security`, `lib/db` |
| `lib/compensation/` | **Track D** — cycles, recommendations | `lib/security`, `lib/db` (production gated) |
| `lib/workflow/` | **Track D** — definitions, instances | `lib/security`, `lib/db` (production gated) |
| `lib/engagement/` | **Track D** — surveys | `lib/security`, `lib/db` (production gated) |
| `lib/security/` | Auth, ABAC, route policies | Shared kernel — no imports from domain folders |
| `lib/api/v1/` | HTTP helpers (`defineV1Route`, guards) | `lib/security` |

---

## Non-negotiables (same as [bounded-contexts.md](./bounded-contexts.md))

1. **Payroll never mutates Core HR aggregates** outside owning services — use events/APIs when split.
2. **No cross-folder Prisma writes** that skip the owning module (e.g. recruiting must not update `PaymentInstruction`).
3. Route handlers in `src/app/api` call **one** domain module per mutation.

---

## Allowed shared imports

- `@/lib/prisma` / `lib/db` — data access
- `@/lib/security/*` — auth context, policy engine
- `@/lib/api/v1/*` — route wrappers

---

## Track D

Compensation, workflow, engagement, positions APIs are **quarantined in production** unless `TRACK_D_API_ENABLED=1` — see [deferred-platform-track.md](../product/deferred-platform-track.md).
