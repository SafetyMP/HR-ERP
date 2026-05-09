# RBAC permission catalog & ABAC attributes

Human-readable registry. Machine source of truth: [`lib/security/permissions.ts`](../../lib/security/permissions.ts) and [`lib/security/abac-attributes.ts`](../../lib/security/abac-attributes.ts).

## Roles (examples)

| Role ID | Intent |
|---------|--------|
| `employee` | Self-service HR surface (scoped to own record where ABAC allows). |
| `manager` | Read/write direct reports within org subtree; no payroll secrets unless extended. |
| `hr_admin` | Tenant HR operations; excludes destructive infra. |
| `payroll_admin` | Payroll-classified data; requires higher MFA assurance in ABAC. |
| `auditor_readonly` | Read aggregate/event feeds; no mutating APIs. |

Roles are **never** accepted from the client unbound from the authenticated principal.

## Permissions (granular)

| Permission ID | Description |
|---------------|-------------|
| `employees:list` | List employees in tenant subject to ABAC row scope. |
| `employees:read` | Read a specific employee profile. |
| `employees:write` | Create/update employee core HR attributes. |
| `onboarding:read` | Read onboarding tasks for scoped employees. |
| `onboarding:write` | Mutate onboarding tasks for scoped employees. |

Add new permissions in `permissions.ts` **before** exposing routes.

## ABAC attribute dictionary

| Attribute | Applies to | Example use |
|-----------|----------------|-------------|
| `tenantId` | Subject | Hard tenant boundary; mirrored into DB session for RLS. |
| `orgUnitId` | Subject | Restrict HRBP scope to org subtree. |
| `managerEmployeeId` | Subject | Anchor manager-chain checks for approvals. |
| `subjectEmployeeId` | Subject | Link login principal ↔ employee row for self-service. |
| `dataClassification` | Resource | `public` / `internal` / `confidential` / `regulated`. |
| `mfaLevel` | Subject | `none` / `standard` / `step_up`; gate payroll/legal-export routes. |
| `environment.ipCountry` | Environment | Geo policy (allow/deny lists). |

Predicates are implemented in [`lib/security/policy-engine.ts`](../../lib/security/policy-engine.ts). Database-tier predicates mirror **tenant** (and future columns such as `org_unit_id`) via RLS; richer ABAC stays in the application until modeled as columns or security-barrier views.
