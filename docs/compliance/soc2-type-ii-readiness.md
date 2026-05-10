# SOC 2 Type II readiness — control matrix

> Status: Phase 3 scaffold. This document maps the AICPA Trust Services
> Criteria (TSC) most relevant to a multi-tenant HR ERP to concrete artifacts
> in this repository, plus the gaps a Type II audit window will surface.
> Counsel + a SOC 2 auditor must agree on scope and boundary before
> readiness work is treated as audit-ready.

## Scope and boundary

The audit boundary is the HR ERP application + the Postgres database +
managed dependencies (object storage, queue, JWKS, telemetry). Carriers and
payroll banks are **out of scope** — they have their own attestations and
are connected via the Phase 2 connector SDK.

## Trust Services Criteria mapping

### Common Criteria (CC) — Security

| Control | Source artifact | Evidence pattern |
| --- | --- | --- |
| CC1.x — Governance | [`AGENTS.md`](../../AGENTS.md), [`docs/architecture/`](../../docs/architecture/) | Org chart, role definitions, policy review cadence. |
| CC2.x — Communication | Onboarding runbook (Phase 3 task) | Acknowledged policies per employee. |
| CC3.x — Risk | [Phase 1 ADR 0004](../../specs/alignment/decisions/0004-modular-monolith-phase1.md) + Risk register | Quarterly risk-register review. |
| CC5.x — Logical access | [`lib/security/permissions.ts`](../../lib/security/permissions.ts), [`docs/security/identity-and-jwks.md`](../../docs/security/identity-and-jwks.md) | RBAC matrix export, JWKS rotation log. |
| CC6.x — Encryption + boundaries | TLS termination at ingress, AES-256-GCM at rest, [`docs/security/`](../../docs/security/) | Cipher inventory, key rotation evidence. |
| CC7.x — Operations / change | [`.github/workflows/`](../../.github/workflows/), [`scripts/check-openapi-drift.mjs`](../../scripts/check-openapi-drift.mjs) | CI green logs, change-management tickets. |
| CC8.x — Change risk | Code-review SLA, [`specs/templates/security-review.md`](../../specs/templates/security-review.md) | Sampled PR reviews. |
| CC9.x — Risk mitigation | Vendor risk register (Phase 3 task) | Annual vendor reassessments. |

### Availability

| Control | Source artifact | Evidence pattern |
| --- | --- | --- |
| A1.1 — Capacity | Helm autoscaling stanza ([`deploy/helm/hr-erp/values.yaml`](../../deploy/helm/hr-erp/values.yaml)) | HPA decisions / utilization graphs. |
| A1.2 — Backup + recovery | Postgres PITR (provider-specific), [`docs/architecture/database-migrations-and-state.md`](../../docs/architecture/database-migrations-and-state.md) | DR drill report (twice per year). |
| A1.3 — Monitoring | OTLP exporter wiring | Alert evidence, SLO reports. |

### Confidentiality

| Control | Source artifact | Evidence pattern |
| --- | --- | --- |
| C1.1 — Data classification | [`lib/security/abac-attributes.ts`](../../lib/security/abac-attributes.ts), [`docs/architecture/soft-delete-and-retention.md`](../../docs/architecture/soft-delete-and-retention.md) | Per-table classification register. |
| C1.2 — Disposal | Soft-delete + retention sweep job (`retentionExpiresAt`) | Quarterly purge log. |

### Processing Integrity

| Control | Source artifact | Evidence pattern |
| --- | --- | --- |
| PI1.1 — Inputs | OpenAPI validator + Zod schemas | Drift CI report (`npm run contracts:drift`). |
| PI1.2 — Processing | [`packages/payroll-calc/`](../../packages/payroll-calc/), payroll fingerprint replay | Fingerprint diff per pay run. |
| PI1.3 — Outputs | Webhook publisher signing ([`lib/webhooks/signing.ts`](../../lib/webhooks/signing.ts)) | Signature verification logs. |

### Privacy (when in scope)

| Control | Source artifact | Evidence pattern |
| --- | --- | --- |
| P1 — Notice | Tenant data-processing addendum (legal task). | Signed DPAs. |
| P3 — Choice and consent | Consent capture flow (Phase 3 task). | Per-tenant consent log. |
| P5 — Quality | Soft-delete mixin + retention sweep. | Cron job evidence. |

## Open gaps before window opens

1. **Vendor risk register** — list managed services (Postgres provider, JWKS
   issuer, observability) with attestation status; refresh annually.
2. **Quarterly access reviews** — automated export of `Employee.status` ×
   role grants vs. termination dates.
3. **Backup restore drill** — at least one full restore-into-staging exercise
   per audit period.
4. **Pen-test cadence** — annual third-party test; document remediation SLA.
5. **Incident runbook** — covering data exfiltration, RLS bypass, payroll
   miscalculation, vendor breach. Tabletop exercise twice per period.
6. **Code-review SLA evidence** — sample 10% of merged PRs to confirm
   `specs/templates/security-review.md` was followed when applicable.

## How CI maps to controls

* `npm run lint` + `npx tsc --noEmit` → CC8.1 (change discipline).
* `npm run contracts:drift` → PI1.1.
* `npm test` (vitest unit + integration) → PI1.2 + PI1.3.
* `prisma migrate diff` against the canonical schema → CC8.1 + C1.1.
* Helm template render in CI (planned) → A1.1.
