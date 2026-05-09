# Analytics anonymization contract

This document defines what may leave the **OLTP (core HR)** boundary for **training and analytics** stores.

## Principles

- **Purpose limitation**: Analytics pipelines consume data only for documented models (flight risk, skills similarity, comp competitiveness).
- **Minimization**: Free-text performance narratives are **not** copied into `analytics_feature_snapshots.features` by default. Use structured fields and numeric sentiment only.
- **Stable pseudonyms**: `employees.anonymized_pseudonym` can join to analytics exports without shipping email or legal name to batch stores.
- **Tenant isolation**: Row Level Security (`app.tenant_id`) applies to analytics tables the same way as core HR; batch jobs must `set_config` at session start (see `scripts/seed-predictive-demo.ts` and Python ETL).

## Feature bundle (`analytics_feature_snapshots.features`)

JSON keys used by churn v1 / ETL (extend with versioning):

| Key | Description |
|-----|-------------|
| `tenure_months` | Derived from `hire_date` |
| `pto_hours_remaining` | Latest `pto_balances.balance_hours` |
| `pto_requests_90d` | Count from `pto_requests` |
| `comp_band_position` | Latest `compensation_records.band_position` |
| `review_sentiment` | Latest `performance_reviews.sentiment_score` |
| `market_comp_ratio` | Internal comp / benchmark median (filled when benchmarks exist) |

## Right to erasure

When an employee is erased from core HR, foreign keys `ON DELETE CASCADE` remove dependent analytics rows (`churn_scores`, `employee_skills`, snapshots).

## Review

Counsel / Works Council review is required before enabling individual-level model output in production jurisdictions (especially EU).
