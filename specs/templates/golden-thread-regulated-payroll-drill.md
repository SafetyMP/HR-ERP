# Regulated payroll / time drill — Legal → Compliance → payroll-calc → QA

Use **only** when a change executes or persists **pay, time allocations, overtime/premium, withholdings tiers, fingerprints, or `COMPLIANCE_*`** paths. Companion stub for generic scopes: [golden-thread-trace-table.md](./golden-thread-trace-table.md).

Paste into the PR description and fill rows before merge.

## 1. Legal / counsel artifact

| Counsel checklist or memo path | Primary sources cited (URLs) | “Interpretation TBD” flags |
| --- | --- | --- |
| _(e.g. `specs/templates/legal-checklist.md` + PR subsection)_ | | |

## 2. Backend compliance (matrices / invariants / golden vectors)

| Matrix or invariant reference | Artifact path (`docs/compliance/**`, migrations, enums) | Golden vector IDs or fixtures |
| --- | --- | --- |
| _(jurisdiction × worker type)_ | | |

Link **`hr-backend-compliance`** expectations explicitly; delegated Implementation must cite the same IDs in tests.

## 3. Payroll calculation kernel (`packages/payroll-calc/`)

| Pipeline stage touched | Input fingerprint / `calcSemanticVersion` notes | Replay test path |
| --- | --- | --- |
| _(e.g. proration tier)_ | | |

Attach **`hr-payroll-calculation-engine`** assertions; **never** silently change tier math without a version bump + vector update.

## 4. QA / UAC mapping

| Brief UAC # | Automated test path or Playwright slug | Scenario / seed IDs (`hr-erp-qa-chaos`) |
| --- | --- | --- |
| UAC _(n)_ | | |

QA executes **numbered UAC verbatim**; ambiguous UAC = PO defect—not assumed coverage.
