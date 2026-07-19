# ADR 0023: Core HR employee contract — POST/PATCH/list/get

**Date:** 2026-07-19  
**Status:** Accepted  
**Deciders:** Site delivery (core-hr program)  
**Tags:** api, core-hr, employees

## Context

Employee GET list/get previously returned a narrow public shape, ordered by `createdAt desc`, without soft-delete exclusion or assignment filters. Handoff requires closed fields and write paths.

## Decision

Align Employee HTTP surface to closed fields via `lib/core-hr/employees.ts`: POST create (ACTIVE department + job role), PATCH closed mutables, GET list with optional direct `departmentId`/`jobRoleId` filters and ascending `id`, GET by id excluding soft-deleted rows. Reuse 16 KiB body gate and ErrorEnvelope PII-safe Zod details.

## Consequences

**Positive:** Single closed DTO for Core HR employee reads/writes.  
**Negative / trade-offs:** Public-profile cache payload expands; ESS clients see additional linkage fields.  
**Operational:** Cache key prefix unchanged; invalidate on PATCH.

## Alternatives considered

1. **Separate `/api/v1/core-hr/employees` namespace** — rejected; handoff binds existing `/api/v1/employees`.  
2. **Keep createdAt desc ordering** — rejected; deterministic `id` asc required.

## Implementation notes

- Routes: `src/app/api/v1/employees/route.ts`, `[employeeId]/route.ts`  
- Soft-delete: `deletedAt: null` on default reads  

## References

- Corporate master-spec R-004–R-011  
