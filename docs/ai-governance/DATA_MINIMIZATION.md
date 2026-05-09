# Data minimization and sensitive attributes

## Principle

Process **only** data that is **adequate, relevant, and limited** to what is necessary for the specific, explicit purpose of the AI feature—aligned with GDPR Article 5(1)(c) and organizational retention policy.

## Feature allowlist

For each AI feature, maintain a **published feature allowlist** (columns/features permitted in training and inference). PRs that add inputs **must** update the allowlist and complete a **Data Impact note** (see [PR_CHECKLIST.md](./PR_CHECKLIST.md)).

## Challenge prompts for Data & Analytics

Before adding fields, answer:

1. **What decision** does this feature support, and **which lawful basis** applies?
2. **Is this attribute strictly necessary**, or can we use a coarser proxy with lower risk?
3. **Can we achieve the goal** without **direct identifiers** (name, exact address) in the model path?
4. **What is the retention TTL** for model inputs and outputs?

### Examples

- **Age** — Often unnecessary for churn; if used, **counsel must approve** jurisdiction-wise; consider **tenure bands** instead of DOB in analytics stores.
- **Postal / ZIP** — High proxy risk for protected classes; prefer **region** or **office cluster** if geography is needed; **never** use as a default feature for resume fit.
- **Emergency contact** — **Out of scope** for ML; exclude from analytics exports by construction.

## Masking and tokenization

- **Operational DB:** store canonical HR records; restrict ML training exports via **separate** pipelines.
- **Analytics / warehouse:** use **pseudonymous keys**; tokenize national IDs and account numbers; avoid free-text blobs in feature stores unless redacted.
- **Logs:** follow [`lib/security/safe-log.ts`](../../lib/security/safe-log.ts); never log raw model feature vectors with PII.

## Separation of environments

- **Training data** snapshots are **versioned** and **access-controlled**; `datasetSnapshotId` referenced on each proposal where applicable.
- **Production inference** must not pull ad hoc joins that expand PII beyond the allowlist.

---

Revision: 2026-05-09
