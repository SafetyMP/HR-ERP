# ARCHIVED excerpt — Security blueprint

**Status:** ARCHIVED — implemented in `lib/security/`  
**Source:** `~/.cursor/plans/hr_erp_security_blueprint_a116263a.plan.md`

## Durable decisions (implemented)

- JWT → RBAC → ABAC → Postgres RLS (deny by default).
- Central route policy registry (`lib/security/route-policies.ts`).
- TLS 1.3 + AES-256-GCM for field-level secrets; no PII in logs.
- CI guards: security scan, unsafe SQL bans, route policy parity tests.

## Active docs

- [docs/security/policy-catalog.md](../../../security/policy-catalog.md)
- [docs/security/rls-session-contract.md](../../../security/rls-session-contract.md)
