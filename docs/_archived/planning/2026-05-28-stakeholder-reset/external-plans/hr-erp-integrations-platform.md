# ARCHIVED excerpt — Integrations platform

**Status:** ARCHIVED — webhooks shipped; connector briefs 023–025 next  
**Source:** `~/.cursor/plans/hr_erp_integrations_platform_5ef4776a.plan.md`

## Durable decisions (implemented)

- Outbox + BullMQ workers: `worker:webhooks`, `worker:integrations`.
- Webhook HMAC verification, encrypted secrets, DLQ replay tooling.
- One module per vendor connector with `validateCredentials`, `pushOutbound`, `handleWebhook`.

## Next (Phase C)

- Briefs **023–025** in [feature-briefs/](../../../product/feature-briefs/) — SCIM hardening, payroll partner export, benefits outbound stub.
