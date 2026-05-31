# `src/` — application layer

Next.js App Router UI and thin route handlers. **Business rules live in [`lib/`](../lib/README.md)** — routes call one domain module per write.

## `src/app/` — routes

| Segment | Audience | Notes |
| --- | --- | --- |
| [`employee/`](app/employee/) | ESS | **Home:** `/employee` (Feature 022 shell, prefetch) |
| [`manager/`](app/manager/) | Managers | Recruiting, team attendance, performance |
| [`hr/`](app/hr/) | HR / payroll ops | Pay runs, benefits queues, life events |
| [`api/`](app/api/) | HTTP | `/api/v1/*`, auth, governance, mock (demo-gated) |
| [`analytics/`](app/analytics/) | Demo analytics | Requires `ANALYTICS_DEMO_MODE=1` |
| [`demo/`](app/demo/) | Phase 3 hub | Capability snapshot (demo) |
| [`examples/`](app/examples/) | Dev samples | Jurisdiction, onboarding, org, reporting |
| [`global-l10n/`](app/global-l10n/) | L10n lab | Not buyer-demo inventory |
| [`qa-lab/`](app/qa-lab/) | QA | Internal |
| [`page.tsx`](app/page.tsx) | Marketing home | Links into employee / manager / HR |

Layouts: root [`layout.tsx`](app/layout.tsx) · employee [`employee/layout.tsx`](app/employee/layout.tsx).

## Other `src/` folders

| Path | Role |
| --- | --- |
| [`components/`](components/) | Shared UI (Radix + Tailwind) |
| [`features/`](features/) | Feature-specific UI modules |
| [`stores/`](stores/) | Zustand (ephemeral UI only) |
| [`lib/`](lib/) | **Client** hooks, fetch, query — resolves after root `lib/` per `tsconfig` paths |

## Conventions

- Server Components: prefetch + `MeQueryHydrator` on hot ESS paths — see [FRONTEND.md](../FRONTEND.md).
- API routes: `defineV1Route` from `@/lib/api/v1` — policies in `lib/security/route-policies.ts`.
- Generated Prisma client may appear under `app/generated/prisma/` — build output.

**Tests:** [`tests/`](../tests/README.md) · **Scripts:** [`scripts/`](../scripts/README.md)
