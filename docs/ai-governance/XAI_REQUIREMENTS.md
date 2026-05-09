# Explainable AI (XAI) requirements

## Principle

HR users must be able to understand **why** the system surfaced a recommendation or risk signal in **business terms**, tied to **specific inputs or rules**, subject to safety constraints (anti-gaming, confidentiality).

This is **not** a substitute for documenting static business rules; ML and LLM outputs need **structured explanations** stored alongside decisions.

## Minimum explanation object

Each AI-backed **decision proposal** must persist an **explanation snapshot** (JSON schema versioned; see `AiExplanationSnapshot` and [`lib/governance/explanations.ts`](../../lib/governance/explanations.ts)) including:

1. **Summary** — one to three sentences for HR UI, neutral tone, no protected-class speculation.
2. **Top factors** — ordered list of **human-readable** factors with directionality (e.g., “Tenure < 6 months: increases attrition risk score”); map internal feature names to labels.
3. **Model / rules metadata** — `modelVersion`, optional `rulesetVersion`, `trainingCutoff` or release tag.
4. **Uncertainty** — calibrated bucket or disclaimer when outputs are probabilistic; no false precision.
5. **Limitations** — known failure modes from the model card (see [MODEL_CARD_TEMPLATE.md](./MODEL_CARD_TEMPLATE.md)).

## Generative / LLM features

- **Separate** retrieved facts (RAG) from **model-generated** text; show **citations** for factual claims about people.
- **Ban** fabricated credentials or performance history; apply **groundedness** checks before showing to managers where feasible.

## Retention and access

- Explanations are **classified** as internal HR data; RBAC restricts who can view raw feature contributions vs. summary-only views.
- **Counterfactual** explanations (“change X to improve score”) are **role-gated**—default off for candidates-facing flows; counsel review before enabling.

## Accessibility

- Explanation UI must meet WCAG targets adopted by the product; avoid color-only cues for risk.

---

Revision: 2026-05-09
