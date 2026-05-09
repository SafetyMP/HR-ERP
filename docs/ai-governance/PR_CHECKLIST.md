# Pull request checklist — AI / ML changes

Copy into PR description when touching ML, scoring, LLM, or AI-assisted HR workflows.

## Product and legal

- [ ] **Intended use** and **out-of-scope** uses updated in model card or feature spec.
- [ ] **Lawful basis** and **DPIA** touchpoint recorded (link to ticket); Legal consulted if new data category or geography.
- [ ] **Data Impact note** filed: new fields, retention, who can access, alternates considered.

## Data and fairness

- [ ] **Feature allowlist** updated; no shadow columns in training/inference.
- [ ] **Bias / disparity evaluation** attached (definitions approved with Legal where protected attributes involved) OR explicit “N/A” with justification.
- [ ] **Drift monitoring** plan or ticket for post-deploy metrics.

## Explainability

- [ ] **Explanation schema** version bumped if payload shape changed; migration for stored snapshots if needed.
- [ ] HR-facing copy reviewed for **neutral, non-discriminatory** language.

## Human-in-the-loop

- [ ] No new API allows **high-stakes execution** without `APPROVED` proposal (see [`lib/governance/high-stakes.ts`](../../lib/governance/high-stakes.ts)).
- [ ] State transitions emit **audit events** (append-only).

## Security

- [ ] PII paths reviewed; **no secrets** in prompts or logs.
- [ ] **Model artifacts** access-controlled; SBOM or vendor attestation where applicable.

## EU AI Act / high-risk posture (engineering checklist only)

- [ ] **Technical documentation** artifact location linked (architecture, data governance, risk controls).
- [ ] **Human oversight** hooks verified in E2E or integration test stubs.

---

Revision: 2026-05-09
