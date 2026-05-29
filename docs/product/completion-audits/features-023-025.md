# Phase C completion audit — Features 023–025

**Date:** 2026-05-28  
**Status:** Implemented

## Feature 023 — SCIM / IdP production hardening

| UAC | Status | Evidence |
| --- | --- | --- |
| 1 RLS under integration tests | **Met** | `tests/integration/scim/scim-rls.integration.test.ts` |
| 2 Cross-tenant ID → 404 | **Met** | `tests/integration/scim/scim-cross-tenant.integration.test.ts` |
| 3 Token rotation without downtime | **Met** | `previousToken` in `SCIM_TENANT_TOKENS`; [scim.md](../../security/scim.md) |
| 4 Employee + auth mapping | **Met** | `UserAccount` upsert in `lib/scim/users-service.ts` |
| 5 Deprovision inactive | **Met** | `terminateScimUser` → `TERMINATED` |
| 6 Rate limit 429 + Retry-After | **Met** | `lib/scim/rate-limit.ts` |
| 7 Production checklist SCIM | **Met** | [phase1-production-checklist.md](../../operations/phase1-production-checklist.md) § SCIM |

## Feature 024 — Payroll partner export connector

| UAC | Status | Evidence |
| --- | --- | --- |
| 1 Trigger export from UI/API | **Met** | `POST .../partner-export`, HR period UI button |
| 2 Payload includes artifact + checksum | **Met** | `lib/integrations/vendors/phase-c-handlers.ts` |
| 3 Idempotent export ID | **Met** | `PayrollPartnerExport.exportId` + unique constraint |
| 4 `payroll.period.locked` before export | **Met** | Lock required; artifact from brief 018 |
| 5 Encrypted credentials + ABAC | **Met** | `integrations:configure`, `IntegrationInstance` |
| 6 Failed export → DLQ | **Met** | Worker retry + `integration_dead_letters` |
| 7 Partner handoff runbook | **Met** | [filing-partner-transmission-gate.md](../../compliance/filing-partner-transmission-gate.md) |

## Feature 025 — Benefits carrier outbound stub

| UAC | Status | Evidence |
| --- | --- | --- |
| 1 `benefits.enrollment.changed` on approval | **Met** | `decideBenefitLifeEvent` + outbox |
| 2 Worker delivers to carrier webhook | **Met** | `BENEFITS_CARRIER_NOTIFY` job |
| 3 Payload without SSN | **Met** | employee business ID only |
| 4 HMAC + encryption patterns | **Met** | Reuses `deliverWebhookHttp` |
| 5 Admin configure per tenant | **Met** | `PUT /api/v1/integrations/instances` |
| 6 DLQ + replay | **Met** | Existing `integrations:replay-dlq` |
| 7 Counsel disclaimer (not certified 834) | **Met** | Brief 025 + cobra gate doc |

**W6 integrations:** **Met** (3 curated connectors: SCIM, payroll partner, benefits carrier)
