# Feature brief: Pay transparency posting fields (July 2026 teaching surface)

**ID:** 029-pay-transparency-posting-fields  
**Status:** PO approved — Shipped (teaching surface)  
**Last updated:** 2026-07-18  
**Track:** Track A extension (same pattern as 023–028 — **not** merged into the 155 Track A UAC denominator unless PO re-baselines)  
**Counsel calendar:** [july-2026-us-state-calendar.md](../../compliance/july-2026-us-state-calendar.md)

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Hiring manager / HR posting internal requisitions who need a mid-2026-credible pay-range teaching surface |
| **Job-to-be-done** | Capture optional good-faith pay range (+ posting jurisdiction hint) on a requisition and show it when the role is open |
| **Pain today** | `JobRequisition` has title/description only — no pay-range fields after VA/ME July 2026 transparency laws |
| **Outcome** | Demo/reference forks can practice pay-transparency hygiene without claiming certified multi-state compliance |
| **Scope boundary** | No automated jurisdiction engine, OFCCP/EEO reporting, background-check vendors, penalty math, public career site, or statutory recordkeeping vault |

---

## Empathy / process

Managers drafting reqs need a place for the range they will publish. Candidates and auditors expect ranges on open roles. Salary history must not sneak into application forms. Fair Chance remains a **copy pattern** only (014 keeps background checks out of scope).

---

## Personas & scenarios

1. **Given** a manager with `recruiting:requisition_write` **when** they create a requisition with min/max pay and currency **then** the values persist and appear on the requisition list/detail.
2. **Given** an OPEN requisition with a pay range **when** the manager views the pipeline page **then** the pay range is visible without opening API docs.
3. **Given** application create **when** a client sends prior-pay / salary-history fields **then** those fields are ignored or rejected — the API schema does not accept them.
4. **Given** the pipeline UI **when** a manager reviews stages **then** they see Fair Chance teaching copy that criminal-history inquiry is deferred until a conditional offer.

---

## Prioritization rationale

July 2026 state calendars make pay transparency a table-stakes recruiting story. Small schema + UI delta on existing 014 surfaces; counsel-gated calendar documents deferrals honestly.

---

## User acceptance criteria (UAC)

1. `JobRequisition` supports optional `payRangeMin`, `payRangeMax`, `payRangeCurrency` (default `USD`), and optional `postingJurisdiction` (e.g. `US-VA`) via forward-only migration.
2. `POST /api/v1/recruiting/requisitions` accepts the new fields; validation rejects `min > max` and empty/invalid currency.
3. OpenAPI (`contracts/openapi/core-hr-v1.yaml`) documents the fields on create/list schemas.
4. Manager UI create form includes optional pay-range inputs; OPEN/detail views display the range when present.
5. Application create path does **not** accept salary-history / prior-pay fields (schema + domain).
6. Pipeline UI shows Fair Chance teaching note (no background-check product).
7. Unit tests cover range validation; recruiting tests cover create-with-range when integration DB is available.

---

## Friction checks

- **Task-time target:** Add pay range during create without leaving the form (≤15s extra).
- **Empty state:** Range optional; no error when omitted (teaching surface, not hard statutory gate).
- **Errors:** Plain language for invalid range (min > max).

---

## Notes for Frontend

- Extend `/manager/recruiting` create card; show range on list rows and requisition detail header.
- Fair Chance note on pipeline page only — no new models.

## API references

- `GET|POST /api/v1/recruiting/requisitions`
- `GET /api/v1/recruiting/requisitions/{id}` (if present)
- OpenAPI: `contracts/openapi/core-hr-v1.yaml`

## Related

- [014-hiring-manager-recruiting-pipeline.md](./014-hiring-manager-recruiting-pipeline.md)
- [july-2026-us-state-calendar.md](../../compliance/july-2026-us-state-calendar.md)
