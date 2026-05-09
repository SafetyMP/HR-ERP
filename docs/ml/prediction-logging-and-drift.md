# Prediction logging, feature lineage, and drift monitoring

This document defines the **prediction log** contract for predictive HR models (for example **flight risk**, time-to-fill, engagement classifiers) and the **drift detection** metrics that trigger automated alerts.

It complements generative [SLM-first routing](../architecture/adrs/0001-slm-first-inference-routing.md); scoring pipelines may share the same observability stack (warehouse + metrics jobs) but use the schema below.

## Goals

- Tie every production score to **`model_id`**, **`feature_set_version`**, and **tenant** for audit and rollback.
- Detect **input drift**, **output drift**, and **segment-specific breakage** early (before fairness or compliance incidents).
- Support **late labels** (attrition months later) via proxy metrics and backfill.

## Prediction log schema (logical)

Store in the analytics warehouse (e.g. `ml_prediction_log` table or event stream). Names are suggestive; map to your warehouse conventions.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `prediction_id` | UUID | yes | Unique row id. |
| `occurred_at` | timestamptz | yes | Time score was produced (UTC). |
| `tenant_id` | text | yes | Tenant identifier (matches app tenancy). |
| `subject_id` | text | no | Employee or entity id (hashed if replicated to less trusted zones). |
| `model_id` | text | yes | Registered model name + version, e.g. `flight_risk_v3`. |
| `model_artifact_hash` | text | yes | Immutable hash of artifact bundle or training run id. |
| `feature_set_version` | text | yes | Version of the feature contract (breaking change = bump). |
| `features_digest` | text | yes | **HMAC-SHA256** or SHA256 over **canonical ordered** feature map (see below). Never store raw PHI in digest source if policy forbids; use server-side feature store id. |
| `features_null_rate` | float | yes | Fraction of expected features that were null/imputed for this row. |
| `score` | float | yes | Primary score (probability or raw). |
| `score_decile` | smallint | no | Decile within rolling calibration window (per tenant optional). |
| `label` | float/bool | no | Ground truth when known (backfilled). |
| `label_observed_at` | timestamptz | no | When label became known. |
| `segment_keys` | jsonb | no | e.g. `{ "region": "EU", "job_family": "RN" }` for drill-down drift. |
| `inference_path` | text | yes | `batch`, `realtime`, `shadow`. |

### Features digest (canonicalization)

1. Serialize features as sorted key-value pairs with stable types (e.g. JSON with sorted keys).
2. Apply **redaction** per DLP policy before hashing.
3. `features_digest = HMAC_SHA256(secret, canonical_blob)` using a **server-side** secret so digests are not guessable from public data.

Use the digest for **duplicate detection**, **distribution comparisons**, and debugging without exporting full feature vectors to general logs.

## Baselines

For each `model_id` + `feature_set_version`:

1. **Training baseline:** distributions of key features and `score` on the training holdout.
2. **Production gold week:** first stable production window (e.g. 7 days) with acceptable error rates — used as a comparative baseline if training and prod differ legitimately.

## Drift metrics

Compute on a **daily** cadence (hourly for high-risk models) with sliding windows (e.g. current 7d vs baseline or previous 7d).

| Metric | Description | Typical alert |
|--------|-------------|----------------|
| **PSI** (Population Stability Index) | Sum of `(actual% - expected%) * ln(actual%/expected%)` per bin on `score` or top features | PSI &gt; 0.25 warn; &gt; 0.35 page |
| **KS** (Kolmogorov–Smirnov) | Max CDF difference vs baseline on continuous features | p &lt; 0.01 on primary drivers → warn |
| **Output mass shift** | Top-decile count / population vs baseline | +40% relative in 24h → page (flight risk “everyone flagged”) |
| **Null rate** | `features_null_rate` mean vs baseline | +10 points absolute → warn |
| **Schema / contract** | Missing keys, type errors | Any hard failure → page + block promotion |
| **Segment hot-spot** | PSI computed per `segment_keys.*` | Worst segment PSI &gt; 0.3 while global OK → warn |

### Calibration (when labels exist)

- **Expected Calibration Error (ECE)** or **Brier score** on labeled cohorts (monthly refresh).
- **Precision@k** or **lift@decile** for alert workflows; sudden collapse → page.

### Proxy metrics (late labels)

Until attrition labels land, monitor:

- Voluntary turnover **announcements** rate vs score decile (if available ethically).
- Engagement module usage drops correlated with score spike.
- Survey participation (where applicable).

Treat proxies as **Tier-2 evidence** — useful for early warning, not sole grounding for automated adverse actions.

## Alert severities and response

| Severity | Example | Response |
|----------|---------|----------|
| **Warn** | PSI 0.26 on one feature | Ticket; feature store + data eng review |
| **Page** | Top-decile inflation + null rate jump | Disable **automated** downstream actions; keep scoring for visibility if legal approves |
| **Kill-switch** | Schema break or runaway scores | Serve **previous model version** or rule-based fallback; freeze promotions |

Integrate with on-call (PagerDuty/Opsgenie) for **page** and **kill-switch**. Mirror summary to Slack for visibility.

## MLOps loop (promotion)

1. **Shadow:** new `model_id` scores written to log with `inference_path = shadow` only.
2. **Compare:** distributions and offline metrics vs champion for 7–14 days.
3. **Champion/challenger:** partial traffic only with automatic rollback if **page**-level drift fires within 48h of increase.

## Related documents

- [ADR 0001: SLM-first inference routing](../architecture/adrs/0001-slm-first-inference-routing.md)
- [Agent and MCP threat model](../security/agent-mcp-threat-model.md)
- [Implementation sequence](./implementation-sequence.md)
