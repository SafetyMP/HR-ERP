---
name: hr-erp-security-identity
description: >-
  Enforces the HR ERP Security & Identity Architecture Blueprint: RBAC+ABAC,
  deny-by-default route policies, Postgres RLS with transaction-scoped session
  GUCs, JWT/middleware contracts, TLS 1.3 / AES-256-GCM expectations, CI
  security-scan and unsafe-SQL bans, and merge hard-stops for PII logging and
  client-trusted authority. Use when implementing or reviewing APIs, Next.js
  middleware, Prisma/raw SQL, migrations, auth tokens, tenant isolation,
  encryption, or when the user mentions security review, RLS, ABAC, IDOR,
  or agent-security.
---

# HR ERP — Security & Identity (repo skill)

Operating assumption: **external and internal attackers**. Design fails closed at **policy + database** when application code slips.

## Load first (source of truth)

1. [docs/security/stack-decision.md](../../../docs/security/stack-decision.md) — stack and enforcement plane.
2. [docs/security/policy-catalog.md](../../../docs/security/policy-catalog.md) — roles, permissions, ABAC attributes (narrative).
3. [docs/security/rls-session-contract.md](../../../docs/security/rls-session-contract.md) — `app.tenant_id` / `app.subject_id` + RLS expectations.
4. [docs/security/tls-and-data-at-rest.md](../../../docs/security/tls-and-data-at-rest.md) — TLS 1.3 and KMS / AES-256-GCM layering.

## Implementation map (where code lives)

| Concern | Location |
|--------|-----------|
| Permissions & role matrix | [lib/security/permissions.ts](../../../lib/security/permissions.ts) |
| ABAC predicates (MFA, classification) | [lib/security/abac-attributes.ts](../../../lib/security/abac-attributes.ts), [lib/security/policy-engine.ts](../../../lib/security/policy-engine.ts) |
| Route → policy registry (deny-by-default) | [lib/security/route-policies.ts](../../../lib/security/route-policies.ts) — **register every new `/api/v1/*` method + path** |
| JWT verify + `AuthContext` | [lib/security/jwt.ts](../../../lib/security/jwt.ts), [lib/security/auth-context.ts](../../../lib/security/auth-context.ts) |
| Bearer auth for handlers | [lib/security/request-auth.ts](../../../lib/security/request-auth.ts) (`requireBearerAuth`) |
| RLS + RBAC + ABAC in one transaction | [lib/security/with-authorized-transaction.ts](../../../lib/security/with-authorized-transaction.ts) |
| Edge authn gate | [middleware.ts](../../../middleware.ts) (`/api/v1/:path*`) |
| Field-level AES-256-GCM | [lib/security/field-crypto.ts](../../../lib/security/field-crypto.ts) |
| Structured security logs (no PII) | [lib/security/safe-log.ts](../../../lib/security/safe-log.ts) |
| CI grep gate | [scripts/security-scan.mjs](../../../scripts/security-scan.mjs) (`npm run security:scan`) |
| ESLint: ban `$*RawUnsafe` | [eslint.config.mjs](../../../eslint.config.mjs) |

RLS migrations live under [prisma/migrations/](../../../prisma/migrations/) (see `*enable_rls*` and domain-specific policies). New tenant-scoped tables **must** get RLS in a forward migration.

## Engineering checklist (every API / data change)

- [ ] **Registry:** `getRoutePolicy(method, pathname)` returns a policy for the handler; otherwise treat as **denied** (404/403 per existing patterns).
- [ ] **No client authority:** never trust body/query for `tenantId`, `role`, `isAdmin`, `impersonate` without cryptographic binding to the authenticated principal.
- [ ] **DB access:** tenant mutations go through `withAuthorizedTransaction` (or equivalent) so `set_config('app.tenant_id', …, true)` runs before queries.
- [ ] **Parameterized SQL only:** use `Prisma.sql`; reject `$executeRawUnsafe` / `$queryRawUnsafe`.
- [ ] **Logs:** no names, emails, tokens, raw bodies, or full query strings—opaque ids + correlation id only where needed.
- [ ] **Client-side validation:** UI validation is UX only; server enforces authorization and invariants.

## Merge hard-stops (reject or block)

Align with [.cursor/rules/agent-security.mdc](../../rules/agent-security.mdc):

1. PII or secrets in logs/tests; `console.log` of bodies or tokens.
2. Endpoints without explicit permission / registry binding.
3. Dynamic SQL string concatenation; disabling RLS “temporarily”.
4. Elevating privilege from client-supplied identity fields.

Output for formal reviews: populate [specs/templates/security-review.md](../../../specs/templates/security-review.md) when that template is required by the PR process.

## Dev JWT helper

[scripts/issue-dev-jwt.mjs](../../../scripts/issue-dev-jwt.mjs) — requires `JWT_SECRET` (see [.env.example](../../../.env.example)).

## Coordination

- **Rule pack:** [.cursor/rules/agent-security.mdc](../../rules/agent-security.mdc) — merge-bar wording and review template.
- **Orchestrator:** [.cursor/rules/orchestrator.mdc](../../rules/orchestrator.mdc) — **`hr-erp-security-identity`** is a **mandatory** step 3 pass after **`hr-code-health`** (same **N/A** bar unless **Security skill N/A** verbatim); delegated **Implementation** / **Security-review** Tasks attach this skill per orchestrator Task rules.

## Global reuse (other workspaces)

Copy or symlink this folder to `~/.cursor/skills/hr-erp-security-identity/` if another repo should inherit the same discipline (adapt paths and stack references locally).
