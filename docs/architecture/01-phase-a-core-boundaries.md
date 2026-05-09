# Phase A — Trusted Core Boundaries

This document defines the **authoritative system-of-record** for the HR ERP greenfield: PostgreSQL as HRIS, OIDC identity mapping, RBAC (with ABAC hooks), and audit plus optional domain events.

## Scope (in / out)

| In Phase A (must ship) | Deferred (adjacent layers) |
|------------------------|----------------------------|
| HR entities + tenancy scoping | Edge caches (see `02-phase-bc-edge-semantic-search.md`) |
| RBAC enforcement model in DB | Vector search (Phase C) |
| Append-only audit trail | Wasm / Rust workers (see `03-wasm-rust-adoption-triggers.md`) |
| OIDC subject → internal `User` mapping | PQC / multimodal clients (see `04-crypto-pqc-multimodal-apis.md`) |

## PostgreSQL HRIS sketch (system of truth)

Concrete models live in [`prisma/schema.prisma`](../../prisma/schema.prisma). Summary:

### Tenancy

- **`Tenant`**: logical isolation boundary. Every business row carries `tenantId` unless global reference data (none in MVP).
- **Rule**: APIs and workers must enforce `tenantId` on reads/writes (defense in depth with RLS optional later).

### Organization

- **`OrganizationUnit`**: hierarchical org tree (`parentId` nullable for root).

### Workforce

- **`Employee`**: employment record keyed by tenant; optional link to **`User`** (login persona). `employeeNumber` unique per tenant.
- **Statuses**: `ACTIVE`, `ON_LEAVE`, `TERMINATED` (extensible enum).

### Identity bridge (OIDC SSO assumptions)

We **do not** store passwords in Phase A.

1. **IdP**: Enterprise OIDC (Okta/Azure AD/Google Workspace or equivalent).
2. **Stable subject**: Map `sub` + `iss` (or your IdP’s stable pair) → `User.oidcSubject` (unique per tenant if IdP is per-tenant) or globally unique `(iss, sub)` documented in ops runbooks.
3. **Provisioning**: JIT (first-login creates `User`) or HRIS-led sync — choose one per deployment; JIT is simplest for MVP.
4. **`User.status`**: `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED` — SSO alone does not remove app access unless status is enforced in app session layer.
5. **PII**: `email` duplicated for lookup; authoritative email may remain in IdP — document single source if they diverge.

### RBAC model

| Artifact | Purpose |
|----------|---------|
| `Permission` | Granular capability key, e.g. `employees:read`, `employees:write`, `payroll:approve`. |
| `Role` | Named bundle per tenant, e.g. `hr_admin`, `manager`. |
| `RolePermission` | M:N Role ↔ Permission. |
| `UserRole` | User ↔ Role assignment; **`scopeOrganizationUnitId` nullable** → tenant-wide vs subtree scope (manager pattern). |

**Enforcement**:

- **Application layer**: required for MVP (explicit checks per route/command).
- **Future ABAC**: add JSON `constraints` on `UserRole` or separate policy table; keep **permission keys stable** so policy engines can attach without schema churn.

### Audit logging

- **`AuditLog`**: append-only record of security- and compliance-relevant actions.

| Field | Use |
|-------|-----|
| `action` | Verb + resource, e.g. `employee.update`, `role.assign`. |
| `resourceType` / `resourceId` | Primary entity affected. |
| `payload` | JSON diff or redacted snapshot; **never** store secrets or full PHI unless policy allows. |
| `actorUserId` | Resolved internal user (null only for system jobs with separate `actor` convention). |

**Operational rules**:

- Prefer **structured actions** aligned with SOC2/GDPR evidence (who, what, when, tenant).
- Retention follows legal hold; TTL is a product/legal decision, not engineering default.

### Domain events (optional, recommended before scale)

Phase A schema leaves room for **`DomainEvent`** (outbox):

- **`type`**: `EmployeeHired`, `RoleAssigned`, …
- **`payload`**: JSON; **`occurredAt`** vs **`publishedAt`** for async consumers.
- **Consumers** (later): embeddings worker, notifications — **never** mutate payroll authoritative state solely from eventual consumers without reconciliation.

### Migrations vs `db push`

- **Local/dev**: `prisma migrate dev` after schema stabilizes (see repo README).
- **Production**: only versioned migrations; no `db push`.

## Interfaces to downstream phases

| Phase | Contract |
|-------|----------|
| B | Org directory reads may be cached at Edge — cache keys MUST include `tenantId` + version or ETag sourced from core API. |
| C | Embedding rows reference `Employee.id` / document IDs in Postgres — vectors are rebuildable derivatives. |
| D | Payroll/comp writes stay in transactional core APIs; Wasm remains preview-only. |

## References

- Prisma schema: [`prisma/schema.prisma`](../../prisma/schema.prisma)
- Edge & semantic MVP: [`02-phase-bc-edge-semantic-search.md`](./02-phase-bc-edge-semantic-search.md)
