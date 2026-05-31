# Track D — PO decision record

**Date:** 2026-05-30  
**Decision owner:** Product  
**Related:** [deferred-platform-track.md](./deferred-platform-track.md)

---

## Decision

**Keep Track D quarantined in production** (404 via [`lib/api/v1/track-d-guard.ts`](../../lib/api/v1/track-d-guard.ts)) until **Brief 029** funds promotion of **one** surface with full UAC.

**Do not remove scaffold** in Phase B — supports QA/demo with `TRACK_D_API_ENABLED=1` (Human authorization).

---

## Rationale

| Factor | Assessment |
| --- | --- |
| Track A complete (155/155 UAC) | Buyer story is ESS + payroll + connectors — not comp/workflow/engagement |
| Reference customer exit focus | Track D surfaces confuse 30-minute demo (W1–W5) |
| Engineering cost to productize | Each Track D surface needs PO brief + UAC + counsel where applicable |
| ML/analytics | Block prod ML until AI governance exit ([deferred-platform-track.md](./deferred-platform-track.md)) |

---

## Brief 029 options (when funded)

| Option | Surface | Notes |
| --- | --- | --- |
| A | HR ops engagement summary | Smallest buyer-visible slice; ties to 021 dashboard |
| B | Compensation cycle read API | High counsel/compliance surface — defer |
| C | Remove scaffold | Reduce maintenance if no near-term buyer demand |

**Current choice:** None — remain quarantined.

---

## Buyer/demo rule (unchanged)

Do not list Track D in buyer inventory. Demo script: ESS friction scorecard paths + W1–W5 only.
