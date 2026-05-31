# Frontend conventions (HR ERP)

Patterns introduced with the enterprise UI scaffold live under [`src/app`](/src/app) plus feature folders in [`src/features`](/src/features).

## Employee shell (Feature 022)

- **Layout:** [`src/app/employee/layout.tsx`](src/app/employee/layout.tsx) — persistent nav for all `/employee/*` routes.
- **Home:** [`src/app/employee/page.tsx`](src/app/employee/page.tsx) — portal landing; server-side `prefetchEssHomePage` + [`MeQueryHydrator`](src/components/ess/me-query-hydrator.tsx) hydrate TanStack Query for common `/api/v1/me/*` reads.
- **Route errors:** Per-route `error.tsx` under `src/app/employee/*` keeps failures localized.
- **UX budgets:** Top ESS tasks and Playwright friction specs — [ess-friction-scorecard.md](docs/product/ess-friction-scorecard.md).

## State layering

- **TanStack Query**: server state (caches, retries). Global mutation errors surface polite toasts via Sonner in [`src/app/providers.tsx`](src/app/providers.tsx).
- **Zustand**: ephemeral multi-step UI (see [`src/stores/onboarding-wizard-store.ts`](src/stores/onboarding-wizard-store.ts)); do not treat stores as payroll sources of truth.
- **React Hook Form + Zod**: field validation for human input only—never jurisdictional compliance logic.

## Accessibility

- Prefer Radix primitives in [`src/components/ui`](src/components/ui). Each input needs an associated label, visible error text wired with `aria-describedby`, and predictable focus outlines for keyboard users.
- `eslint-config-next` ships the `jsx-a11y` plugin (recommended severities). ESLint’s flat config cannot register a second copy of the plugin to layer the `strict` preset on top; add rule-level overrides sparingly if we need stricter checks than the Next template.

## API errors

Backend JSON should expose stable `code` values (examples: `PTO_BALANCE_EXCEEDED`).  
[`src/lib/http/user-friendly-errors.ts`](src/lib/http/user-friendly-errors.ts) maps codes to conversational copy while [`normalizeApiError`](src/lib/http/api-client.ts) handles unknown shapes safely.

Configure `NEXT_PUBLIC_API_BASE_URL` when the SPA targets a standalone API tier (omit for same-origin mocks). See [.env.example](.env.example).

## Demo routes

| Path | Purpose |
| --- | --- |
| `/examples/jurisdiction` | API-driven locality field bundle |
| `/examples/onboarding` | Wizard store sample |
| `/examples/org` | Accessible hierarchy from JSON |
| `/examples/reporting` | TanStack Table + Recharts |

## Path aliases

[`tsconfig.json`](tsconfig.json) maps `@/*` to `./src/*` while `@/lib/*` remains the shared backend libs under `/lib`.

## Note on installs

When `npm install` fails inside synced folders such as Downloads, reinstall from a filesystem path without cloud sync jitter (or reuse the toolchain cache in `/tmp`) before copying `node_modules` back.
