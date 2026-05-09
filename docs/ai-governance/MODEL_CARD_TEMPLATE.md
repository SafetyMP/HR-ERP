# Model card template

_Copy per model or ruleset release; store under `docs/ai-governance/model-cards/<feature>-<version>.md` or your ML registry._

## Model identity

| Field | Value |
|-------|-------|
| Name | |
| Version / tag | |
| Owner team | |
| Release date | |
| Model type | (e.g., gradient boosting, linear, LLM + RAG, rules hybrid) |

## Intended use

- **Primary use case** (employment context):
- **Users** (roles):
- **Decision support only** (Y/N): must be **Y** for HR ERP AI features

## Out-of-scope uses

- List **prohibited** uses (e.g., cultural fit stereotypes, health inference, non-job-related scoring).

## Training data

- **Sources** (high level; no sensitive dumps in repo):
- **Label definition** and known biases:
- **Snapshot ID** or lineage reference:

## Evaluation

- **Offline metrics**:
- **Fairness / disparity metrics** (definitions):
- **Failure modes** and red-team results:

## Explainability

- **Method** (e.g., SHAP, LIME, rule trace, attention — only if validated):
- **Schema version** for explanation JSON:

## Monitoring

- **Live metrics**:
- **Rollback / kill-switch** owner and procedure:

## Ethics and compliance

- **Human oversight** workflow link:
- **Legal / DPIA** reference:

---

Revision: 2026-05-09 (template)
