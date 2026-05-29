# Deferred platform track

Routes and surfaces that support demos, QA, or architecture previews but are **not** Track A Feature UAC closure.

## Demo / mock API gates

- `src/app/api/mock/*` — blocked in production unless `ALLOW_DEMO_API_ROUTES=1`
- `src/app/api/global-l10n/*` — requires bearer auth in non-production; blocked in production unless `ALLOW_DEMO_API_ROUTES=1`
- `src/app/demo/*` — UI demos; do not enable production sign-in shortcuts (`NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN`)

## Bounded-context extraction

- Payroll DB: [ADR 0012](../../specs/alignment/decisions/0012-payroll-db-extraction.md)
- Core HR template: [ADR 0013](../../specs/alignment/decisions/0013-core-hr-extraction-template.md)
