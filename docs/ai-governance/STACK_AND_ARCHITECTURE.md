# Reference stack and governance architecture mapping

This repository’s **reference implementation** for AI governance controls uses the following stack. Update this document if the stack changes.

## Stack

| Layer | Choice |
|-------|--------|
| Application | [Next.js](https://nextjs.org/) 16 (App Router) |
| API | Route Handlers under `src/app/api/**` |
| Database | PostgreSQL |
| ORM | [Prisma](https://www.prisma.io/) 7 ([`prisma/schema.prisma`](../../prisma/schema.prisma)) |
| Auth (baseline) | JWT via [`lib/security/jwt.ts`](../../lib/security/jwt.ts); dev headers for local API tests documented per route |
| Crypto utilities | [`lib/security/field-crypto.ts`](../../lib/security/field-crypto.ts), integrations token encryption |

## Governance services (code mapping)

| Playbook concept | Implementation |
|------------------|----------------|
| HITL state machine | [`lib/governance/hitl.ts`](../../lib/governance/hitl.ts) — valid transitions, status enums |
| Explainability payloads | [`lib/governance/explanations.ts`](../../lib/governance/explanations.ts) — Zod schema + hashing |
| Append-only audit | [`lib/governance/audit.ts`](../../lib/governance/audit.ts) + `GovernanceAuditEvent` model (**insert-only** in app code) |
| High-stakes guard | [`lib/governance/high-stakes.ts`](../../lib/governance/high-stakes.ts) — blocks execution without approved proposal |
| Persistence | `AiDecisionProposal`, `AiExplanationSnapshot`, `GovernanceAuditEvent`, `HighStakesEmploymentAction` in Prisma |
| Demo / integration API | [`src/app/api/governance/proposals/route.ts`](../../src/app/api/governance/proposals/route.ts) (create), [`src/app/api/governance/proposals/[id]/route.ts`](../../src/app/api/governance/proposals/[id]/route.ts) (transitions), [`src/app/api/governance/proposals/[id]/execute/route.ts`](../../src/app/api/governance/proposals/[id]/execute/route.ts) (high-stakes execution) |

## Model registry (future)

**Current:** model version and dataset snapshot IDs are **strings** on `AiDecisionProposal` for traceability.

**Future:** promote to a dedicated registry (e.g., MLflow, cloud model registry) and store **registry URI + digest** on proposals.

## Identity and permissions

Governance permissions live in [`lib/security/permissions.ts`](../../lib/security/permissions.ts):

- `governance:ai_propose`
- `governance:ai_approve`
- `governance:ai_execute`
- `governance:audit_read`

Wire production `AuthContext` from your IdP; **do not** use dev headers outside trusted environments.

---

Revision: 2026-05-09
