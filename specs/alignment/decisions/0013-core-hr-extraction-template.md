# ADR 0013: Core HR extraction template (Phase 4)

**Date:** 2026-05-28  
**Status:** Proposed  
**Depends on:** [0012-payroll-db-extraction.md](./0012-payroll-db-extraction.md)

## Context

After Payroll DB cutover, Core HR (employee, org, position) should follow the same extraction pattern without a big-bang monolith rewrite.

## Decision (template)

1. Activate `services/core-hr/db/migrations/` for Core HR aggregates.
2. Move employee/org writes behind `lib/core-hr/ports/` with UUID references only across contexts.
3. Publish `hr.core.employee.v1` (and related) via transactional outbox.
4. Defer Time & Labor and Benefits until Core HR ports are stable.

## Exit criteria

- No cross-database FKs; integration tests prove event + read API paths.
- Recruiting/benefits remain in monolith until explicit port ADRs.
