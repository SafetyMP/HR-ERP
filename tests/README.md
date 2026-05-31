# `tests/` — verification layout

| Layer | Path | Runner |
| --- | --- | --- |
| **Unit** | [`unit/`](unit/), `*.test.ts` at repo root of `tests/` | `npm run test` (Vitest) |
| **Integration** | [`integration/`](integration/) | `npm run test:integration` |
| **UI (client)** | Vitest UI config | `npm run test:ui` |
| **E2E** | [`e2e/`](e2e/) | `npm run test:e2e` (Playwright) |

## Fixtures and helpers

| Path | Role |
| --- | --- |
| [`fixtures/employees/`](fixtures/employees/) | `EmployeeScenario` factories |
| [`helpers/`](helpers/) | Shared test utilities |
| [`generated/`](generated/) | Large batches (gitignored) — `npm run qa:fixtures` |

## E2E auth

Set JWT env vars per suite — see [`.env.example`](../.env.example) (`HR_ERP_ESS_E2E_JWT`, etc.) and [docs/QA.md](../docs/QA.md).

**ESS friction budgets:** `tests/e2e/ess-friction-budgets.spec.ts` — [ess-friction-scorecard.md](../docs/product/ess-friction-scorecard.md).

**Output:** Playwright writes to `test-results/` (gitignored).
