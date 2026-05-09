# Pay premiums: constraints, retention, and acceptance criteria

**Capability:** `pay-premiums-and-allocations-v1`  
**Companion:** [jurisdiction-matrix-pay-premiums.yaml](jurisdiction-matrix-pay-premiums.yaml), [v1-scope.md](v1-scope.md)

---

## 1. Logical invariants (must always hold)

Notation: hours are **decimal hours** with employer-configured **precision cap** (default 4 decimal internal, display rounded per policy).

### INV-1 — Worker type gate

For any invocation of premium allocation with `worker.worker_type != w2_employee`, the engine **must not** emit pay lines; return `COMPLIANCE_WORKER_TYPE_NOT_SUPPORTED`.

### INV-2 — Exempt gate

If `worker.exempt_under_flsa == true` **and** no rows in the jurisdiction matrix apply exempt OT (none in v1), total premium OT hours for the period **must** be zero unless `force_non_exempt_override_flag == true` **and** `override_approver_ref` is non-null (HR attestation). Otherwise return `COMPLIANCE_EXEMPT_NO_OT`.

### INV-3 — Minute-level conservation

For each calendar day `d` and each work situs `g` assigned to time entries:

`sum(regular_minutes) + sum(ot_minutes) + sum(dt_minutes) == sum(worked_minutes_after_caps)`  
where `worked_minutes_after_caps` includes minor hour caps and meal break deductions **only** when legally required and configured by Legal data.

### INV-4 — Non-negativity

All paid hour buckets and rates **≥ 0**. Rates are **≥** configured minimum wage for `g` on `d` when engine also computes **non-premium** regular rate (if regular rate is out of scope, still enforce `rate >= 0`).

### INV-5 — Multi-situs non-duplication

The same physical minute **cannot** be allocated to two jurisdictions’ premium buckets. When a punch carries ambiguous situs, block finalize with `COMPLIANCE_SITUS_AMBIGUOUS` until resolved.

### INV-6 — CBA precedence

When `union_agreement_id` matches a matrix row with `precedence: cba`, numeric thresholds from that row **replace** statute rows for the same `geo_id` for workers covered by that agreement.

### INV-7 — Explainability

Every persisted `PayAllocationLine` **must** include: `rule_pack_version`, `matrix_row_hash`, `input_payload_hash`, `citation_refs[]`, `warnings[]`. Missing **must** block transition `calculation_run` → `finalized`.

### INV-8 — Effective dating

Rules resolve with `effective_from <= period_date <= effective_to || effective_to == null`. If no row matches, block with `COMPLIANCE_RULE_GAP`.

### INV-9 — Statutory overrides (no 40h assumption)

`standard_hours_for_weekly_ot` **must** be read from the matrix or employer policy row **per geo**; hardcoding `40` in code **is forbidden** except as **data default** in YAML where Legal has explicitly listed it.

---

## 2. Data validation rules (API / batch ingest)

| ID | Condition | On fail |
|----|-----------|---------|
| VAL-001 | `time_entry.start < time_entry.end` | `COMPLIANCE_BAD_TIME_RANGE` |
| VAL-002 | Overlapping time entries same worker same day — unless `allow_overlap_reason` in {`different_job_cost_center`, `company_approved`} | `COMPLIANCE_OVERLAPPING_TIME` |
| VAL-003 | `work_situs.geo_id` required on every worked minute in v1 | `COMPLIANCE_SITUS_MISSING` |
| VAL-004 | If `worker.is_minor == true`, `minor_limits_profile_id` must resolve | `COMPLIANCE_MINOR_PROFILE_MISSING` |
| VAL-005 | If `matrix_variant` required (e.g. CA `wage_order_code`) per worker industry, field required | `COMPLIANCE_VARIANT_MISSING` |
| VAL-006 | `flsa_workweek_anchor` required on employer config when computing weekly OT under US-FED | `COMPLIANCE_WORKWEEK_ANCHOR_MISSING` |

---

## 3. State machines

### SM-1 — `PayCalculationRun` (per worker × pay period)

```text
draft ──validate──► validated ──lock──► locked ──finalize──► finalized
  │                    │                    │
  └────────────────────┴────────────────────┴──► void (admin only, audit reason)
```

| Transition | Guard |
|------------|--------|
| `draft → validated` | VAL-* passed; no `COMPLIANCE_*` open |
| `validated → locked` | User role `payroll_analyst` or system batch |
| `locked → finalized` | INV-* satisfied; all lines have audit metadata |
| Any → `void` | Role `payroll_admin`; `void_reason_code` required; **never** hard-delete |

Forbidden: `finalized → validated` without **correction run** linked to original `run_id`.

### SM-2 — `ExemptStatusSnapshot` (effective-dated)

```text
inactive ──hire/change──► active ──supersede──► superseded
```

Only **one** `active` snapshot per worker at a given `effective_at`. Overlaps return `COMPLIANCE_EXEMPT_SNAPSHOT_OVERLAP`.

---

## 4. Data retention and legal hold

Categories below tie to **SOC 2** evidence (change management, audit logging) and wage/tax recordkeeping — **exact years** must be confirmed by Legal per jurisdiction.

| Data category | Minimum retention (engineering default until Legal replaces) | Notes |
|-----------------|--------------------------------------------------------------|--------|
| Finalized `PayCalculationRun` + lines + hashes | **7 years** rolling from **finalize date** | Align with typical payroll statute of limitations guidance |
| Input time entries contributing to finalized run | **7 years** same anchor | Immutable copy at finalize **recommended** |
| Rule packs / matrix YAML versions | **Life of system + 7 years** | Every version retrievable |
| Voided runs | **Same as finalized** | Soft-delete with `void_reason_code` |
| Legal hold flag on worker/org | **Suspends all TTL deletion** | Cron must check `legal_hold.active` |

**Jobs:** retention deletion is **idempotent**, **batch logged**, **dry-run capable**, and never purges if `legal_hold` or open dispute flag.

---

## 5. Compliance-driven acceptance criteria (Given / When / Then)

### AC-1 — Multi-situs CA + TX same period

**Given** a non-exempt W-2 worker with **Monday–Wednesday** punches in `US-CA` (8h each) and **Thursday–Friday** in `US-TX` (10h each), same employer FLSA workweek Sunday–Saturday  
**When** the calculation run finalizes  
**Then** CA days produce **daily OT** per CA matrix; TX days contribute to **weekly** OT only under TX row; totals satisfy INV-3; stub earning codes indicate jurisdiction where required.

### AC-2 — CBA overrides CA daily threshold

**Given** `union_agreement_id: CBA-DEMO-LOCAL100-2024` with matrix row `precedence: cba`  
**When** worker works 7.5h straight in CA  
**Then** **no** daily OT accrues (per demo CBA row); audit line cites `CBA-ART12-OT` not `POL-CA-DIR-OT-001`.

### AC-3 — Exempt employee

**Given** `exempt_under_flsa == true` and no override  
**When** calculation runs  
**Then** OT hours = 0; result code `COMPLIANCE_EXEMPT_NO_OT` logged at INFO; paystub shows **no** OT lines.

### AC-4 — Minor hour cap

**Given** `is_minor == true` and profile caps **max 8h** on school days  
**When** worker has 10h punched  
**Then** **2h** treated per policy as **not worked for pay** or **requires manager exception** per employer rule — v1 default: **block finalize** with `COMPLIANCE_MINOR_HOUR_CAP` until exception; audit shows pre-cap vs post-cap.

### AC-5 — Rule gap

**Given** worker works in geo **not** present in matrix  
**When** finalize attempted  
**Then** hard fail `COMPLIANCE_RULE_GAP`.

### AC-6 — Audit completeness

**Given** a finalized run  
**When** auditor queries any pay line  
**Then** `rule_pack_version`, `matrix_row_hash`, and `input_payload_hash` are present and verify.

---

## 6. Golden vectors (deterministic test inputs)

**Assumptions unless noted:** hourly rate **R = $20.00**, non-exempt, FLSA workweek Sun–Sat, no minors, single situs per day, matrix v0.1.0.

| ID | Scenario | Input (hours by day) | Expected OT dollars (approx) | Notes |
|----|----------|----------------------|------------------------------|--------|
| GV-01 | FLSA weekly only (TX) | One workweek Sun–Sat: Mon–Fri **8h** each + Sat **10h** (all punches `US-TX`) | **50h** worked ⇒ **10h OT** at **1.5×R** ⇒ **$300** OT | Purely weekly threshold row (no CA daily rules) |
| GV-02 | CA daily OT | Mon: **12h** straight; situs `US-CA` | **8h reg** = **$160**; **4h** at **1.5×R** (hours 9–12) = **$120** OT; **0h DT** (none over 12) | CA stacking order must match counsel-approved engine spec |
| GV-03 | CO daily OT | Mon: 13h @ CO | First 12 regular ( matrix says daily_ot_after 12), 1h at 1.5R → OT $30 | Confirm COMPS vs legacy — vector for unit test only |
| GV-04 | CBA demo (CA) | Mon: 8h straight under CBA row | All regular (threshold 7.5 passed? 8 > 7.5 so 0.5h daily OT at 1.5) | Expect **0.5h OT** @ 1.5R = **$15** if only daily threshold; engine must match row |

**QA note:** GV-02 and GV-04 require Legal sign-off on exact splitting order (CA stacking). Tests **must** assert against **snapshot file** produced by payroll SME, not only arithmetic here.

---

## 7. Error code catalog (subset)

| Code | HTTP (if API) | Meaning |
|------|----------------|--------|
| `COMPLIANCE_WORKER_TYPE_NOT_SUPPORTED` | 422 | Contractor / unsupported |
| `COMPLIANCE_EXEMPT_NO_OT` | 200 + zero OT | Informational |
| `COMPLIANCE_SITUS_MISSING` | 422 | |
| `COMPLIANCE_SITUS_AMBIGUOUS` | 409 | |
| `COMPLIANCE_RULE_GAP` | 503 / 422 | |
| `COMPLIANCE_MINOR_HOUR_CAP` | 409 | |
| `COMPLIANCE_WORKWEEK_ANCHOR_MISSING` | 422 | |
| `COMPLIANCE_EXEMPT_SNAPSHOT_OVERLAP` | 422 | |

---

**Revision:** 0.1.0 — Engineering draft aligned to compliance framework plan.
