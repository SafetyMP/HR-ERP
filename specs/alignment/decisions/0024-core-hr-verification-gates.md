# ADR 0024: Core HR verification gates — Postgres suite nested in verify/adversarial

**Date:** 2026-07-19  
**Status:** Accepted  
**Deciders:** Site delivery (core-hr program)  
**Tags:** quality, verification, core-hr

## Context

`verify.sh` clears `DATABASE_URL` for CI/web parity. Corporate acceptance requires nested Core HR Postgres proof (R-013/R-014) and Core HR domain adversarial cases (R-015), without claiming local HS256 as production JWT posture (R-018).

## Decision

1. Add `scripts/core-hr-postgres-suite.ts` (`npm run test:core-hr`) requiring provisioned `DATABASE_URL` + `JWT_SECRET`.
2. Nest that suite at the end of `./scripts/verify.sh` when `HR_ERP_VERIFY_DATABASE_URL` or the pre-clear app `DATABASE_URL` is non-empty; skip (do not claim R-013) when absent. Never use `CORE_HR_DATABASE_URL` (reserved for optional extraction DB).
3. Extend `scripts/adversarial-probes.ts` with hermetic Core HR closed-schema / body-limit / no-DELETE / route-policy probes.
4. When app `DATABASE_URL` (or `HR_ERP_VERIFY_DATABASE_URL`) is set, `adversarial.sh` also runs `scripts/core-hr-adversarial-suite.ts` for hierarchy / inactive-reference / PII-free-error / injection cases (R-010/R-015).
5. Suites tear down tenant fixtures (R-016).

## Consequences

**Positive:** Harness `site_verify` with a provisioned DSN closes R-013/R-014 without breaking empty-URL CI web parity.  
**Negative / trade-offs:** Operators must export `DATABASE_URL` (or `CORE_HR_DATABASE_URL`) before harness evidence capture.  
**Operational:** Documented in `docs/QA.md`.

## Alternatives considered

1. **Always fail verify without Postgres** — rejected; breaks CI web job.  
2. **Separate argv only** — rejected; handoff keeps `./scripts/verify.sh` as site oracle.

## Implementation notes

- Local HS256 tokens in the suite are labeled non-production (R-018).  
- Prerequisites: ADR 0021–0023 routes and schema.

## References

- Corporate acceptance R-008–R-018  
