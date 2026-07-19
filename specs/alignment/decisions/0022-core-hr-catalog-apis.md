# ADR 0022: Core HR catalog APIs — departments and job-roles

**Date:** 2026-07-19  
**Status:** Accepted  
**Deciders:** Site delivery (core-hr program)  
**Tags:** api, core-hr, security

## Context

Corporate handoff `core-hr` requires authenticated `/api/v1/departments` and `/api/v1/job-roles` create/list/get with closed fields, create-only department forest rules, and a 16 KiB write body gate.

## Decision

Expose POST + GET list + GET by id for departments and job-roles under `/api/v1`, backed by `lib/core-hr/departments.ts` and `lib/core-hr/job-roles.ts`. Shared `parseJsonBodyLimited` rejects bodies over 16384 bytes before JSON parse. Deny-by-default `route-policies` with `departments:*` / `job_roles:*` permissions. No DELETE or reparent routes.

## Consequences

**Positive:** Catalog slice matches master-spec closed contracts.  
**Negative / trade-offs:** Forest cycle checks are create-time defensive walks only (parentId immutable after create).  
**Operational:** OpenAPI paths kept in lockstep via `contracts:drift`.

## Alternatives considered

1. **Reuse Position APIs** — rejected; Position is headcount hierarchy, out of slice.  
2. **Python in-process store** — rejected; forbidden by handoff.

## Implementation notes

- Body gate: `lib/api/v1/read-json-limited.ts`  
- Migration prerequisite: ADR 0021  

## References

- Corporate master-spec R-001–R-003, R-007–R-011  
