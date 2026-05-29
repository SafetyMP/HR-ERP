# ARCHIVED excerpt — QA / chaos blueprint

**Status:** ARCHIVED — implemented in `docs/QA.md` and test fixtures  
**Source:** `~/.cursor/plans/hr_erp_qa_chaos_blueprint_f34d4da4.plan.md`

## Durable decisions (implemented)

- `EmployeeScenario` factories + deterministic seeds in `tests/fixtures/employees/`.
- Layered tests: Vitest unit/integration + Playwright E2E per feature brief.
- `FAILURE_SUMMARY` envelope required on CI failures.
- Fake clock + parallel duplicate-submit patterns for temporal bugs.

## Active docs

- [docs/QA.md](../../../QA.md)
- [completion-audits/](../../../product/completion-audits/)
