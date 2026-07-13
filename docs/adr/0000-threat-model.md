# ADR 0000: Threat Model — Caller, Trust Boundary, Authentication

**Status:** Accepted  
**Date:** 2026-07-13  
**Product:** HR ERP

## Context

HR ERP exposes governed APIs and Playwright E2E flows. Cooperative `./scripts/integration-e2e.sh` validates happy paths with minted JWTs. Tier-3 adversarial tests probe routes **without** session credentials.

Machine-readable cells: `specs/threat-model.yaml`. Tier-3: `scripts/adversarial.sh`.

## Decision

### Principals

| Principal            | Scope                          |
| -------------------- | ------------------------------ |
| `anonymous`          | no session / no bearer         |
| `authenticated_user` | valid session JWT              |
| `governance_actor`   | JWT with governance lane roles |

### Trust boundaries

| Boundary           | Route                             | Authentication              | Failure            |
| ------------------ | --------------------------------- | --------------------------- | ------------------ |
| Protected API read | `GET /api/v1/compensation/cycles` | session JWT                 | `401 Unauthorized` |
| Regulated tiers    | T3/T4 paths                       | tier-gated deny hooks + JWT | deny / 401         |

### Authentication mechanism

Next.js API routes validate session JWT (`JWT_SECRET`). Missing or invalid token → `401` before business logic.

## References

- `specs/threat-model.yaml`, `scripts/adversarial.sh`
- `governance-manifest.yaml`, ADR 0016 (harness foundation)
