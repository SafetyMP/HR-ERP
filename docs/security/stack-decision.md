# Stack decision — Security enforcement plane

**Chosen stack (Phase 1):**

| Layer | Choice | Notes |
|--------|--------|--------|
| Application runtime | **Next.js 16** (App Router) | Route handlers under `app/api/**`; middleware at repo root. |
| API authorization | **Server-side RBAC + ABAC** | Declared in [`lib/security/route-policies.ts`](../../lib/security/route-policies.ts); enforced before DB access. |
| Database | **PostgreSQL 16** (Docker locally; **Neon/RDS/Supabase Postgres** in cloud) | Single logical database Phase 1; [`AGENTS.md`](../../AGENTS.md) bounded-context rules still apply. |
| ORM | **Prisma 7** + `@prisma/adapter-pg` | Client generated to `app/generated/prisma`. |
| Row enforcement | **RLS + session variables** | Transaction-scoped `set_config(..., true)` mirrors [`AuthContext`](../../lib/security/auth-context.ts); see [`docs/security/rls-session-contract.md`](./rls-session-contract.md). |

**Non-goals for this document:** picking payroll vendors, identity provider branding, or jurisdiction-specific retention — those live under specs/legal templates.

**Production posture:** application DB role must **not** be superuser; prefer a dedicated `hr_erp_app` role with `NOBYPASSRLS` semantics (no bypass). Table owner + `FORCE ROW LEVEL SECURITY` is enforced in migrations so owners cannot accidentally bypass tenant isolation.
