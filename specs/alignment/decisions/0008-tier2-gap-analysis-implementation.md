# ADR 0008: Tier 2 gap analysis implementation (compliance + integrations)

**Date:** 2026-05-18  
**Status:** Accepted  
**Tags:** payroll, compliance, webhooks, gap-analysis

## Context

Competitive gap analysis Tier 2 (mid-market US+UK) called for:

- **P5** US federal withholding v1 — ADR 0005 (prior session)
- **P6** Time → premium → paystub earnings — ADR 0006 spike; memo-only was insufficient
- **P7** UK PAYE/NI bootstrap — ADR 0007 (prior session)
- **P8** Webhook HTTP delivery worker — deferred in platform track until integration RFC

Human requested **implement phase 2** = this Tier 2 tranche, **not** Phase 2 Kafka/multi-DB topology (still ADR-triggered per `0001-phase1-scope`).

## Decision

1. **P6 phase-1b:** `additionalGrossLines` on `GrossToNetPipelineInput`; `premiumGrossLinesFromAllocation` in `runPayroll` when `PAYROLL_PREMIUM_FROM_ATTENDANCE=1`.
2. **P8:** `fanOutWebhookDeliveries` on `enqueueEvent` for `domain.*` events (disable with `WEBHOOK_FANOUT_ON_ENQUEUE=0`); `processPendingWebhookDeliveries` + `npm run worker:webhooks` (also polled from `worker:integrations`).
3. **Platform Phase 2** (Kafka, DB-per-context) remains **deferred** — no ADR trigger documented.

## Consequences

**Positive:** Paystub can show OT/DT earnings lines; tenants receive HTTPS webhooks with HMAC verification.  
**Negative:** Premium pay uses simplified hourly derivation from annual salary.  
**Follow-up (2026-05-18):** Webhook subscription secrets encrypted at rest via `lib/webhooks/secret-crypto.ts` (`enc:v1:` prefix); backfill with `npx tsx scripts/backfill-webhook-secret-encryption.ts`.  
**Operational:** Run `worker:webhooks` or `worker:integrations` in staging/prod for delivery drain.

## References

- [`docs/product/deferred-platform-track.md`](../../../docs/product/deferred-platform-track.md)
- ADR 0005, 0006, 0007
