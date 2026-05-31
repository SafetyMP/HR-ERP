# `lib/` — server modules

Domain logic and shared infrastructure for API routes and server components. **One owning folder per mutation** — see [lib-module-boundaries.md](../docs/architecture/lib-module-boundaries.md).

## Shared kernel (import anywhere)

| Folder / file | Role |
| --- | --- |
| `security/` | Auth, ABAC, route policies, RLS transactions, JWT |
| `api/v1/` | `defineV1Route`, Track D guard, HTTP helpers |
| `prisma.ts`, `prisma-errors.ts` | App DB client |
| `redis.ts` | Redis connection for workers |
| `auth/` | Session / Neon / OIDC helpers |
| `observability/` | OTEL and timing hooks |

## Employee self-service (ESS)

| Folder | Role |
| --- | --- |
| `ess/` | Home prefetch, shared ESS reads |
| `paystub/` | Current/history paystub |
| `profile/` | Employee profile |
| `pto/`, `time-off/`, `leave/` | PTO and leave |
| `attendance/` | Clock-in, today’s punches |
| `benefits/` | Enrollment, life events, election intent |
| `learning/` | Enrollments |
| `onboarding/` | Checklists |
| `tax-documents/` | Employee tax docs |
| `hr-case/` | Employee HR requests |

## Manager and HR operations

| Folder | Role |
| --- | --- |
| `recruiting/` | Requisitions, applications, offers |
| `performance/` | Goals, review cycles |
| `payroll/` | Pay runs, lock, filing artifacts, partner export |
| `hr/` | HR ops helpers |
| `employees/` | Employee directory reads |
| `org/` | Org structure |
| `separation/` | Offboarding tasks |
| `compliance/` | Rule-pack wiring (not legal advice) |

## Integrations and async

| Folder | Role |
| --- | --- |
| `integrations/` | BullMQ jobs, vendor connectors |
| `connectors/` | Partner export paths |
| `scim/` | SCIM provisioning |
| `webhooks/` | Subscription + delivery |
| `outbox/` | Domain outbox (Kafka path) |

## Track D (production-quarantined)

| Folder | Role |
| --- | --- |
| `compensation/` | Comp cycles |
| `workflow/` | Workflow engine |
| `engagement/` | Surveys / eNPS |
| `positions/` | Position records |

Gated by `lib/api/v1/track-d-guard.ts` — [deferred-platform-track.md](../docs/product/deferred-platform-track.md).

## Platform / demo / AI

| Folder | Role |
| --- | --- |
| `analytics/` | Churn, skills, benchmarks |
| `governance/` | AI governance proposals |
| `copilot/` | In-app agent MCP catalog |
| `l10n/`, `i18n/`, `holidays/` | Global L10n and calendars |
| `qa/` | QA lab helpers |
| `backend/` | Legacy/backend adapters |

**Enforcement:** `npm run check:lib-boundaries` before merge when touching cross-folder imports.
