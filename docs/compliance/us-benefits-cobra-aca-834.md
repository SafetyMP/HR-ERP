# US benefits depth: COBRA, ACA, and 834 outbound

> Status: design — backs the `cobra_events`, `learning_*`, and `workflow_*`
> Prisma tables introduced for Phase 2. Counsel must validate timing and notice
> language before production. The roadmap reference is
> [HR ERP — Competitive Analysis & Roadmap](../../specs/competitive-analysis-roadmap.md).

## COBRA event lifecycle

| Lifecycle | Trigger | Source of truth |
| --- | --- | --- |
| `PENDING_NOTICE` | Qualifying event detected (e.g. termination) | `cobra_events` insert; `qualifying_date` recorded. |
| `NOTICE_SENT` | Notice generated and sent (carrier portal or DocuSign) | `notice_sent_at` set; `workflow_instances` (`COBRA_ELECTION`) opens. |
| `ELECTED` | Beneficiary elected continuation | `elected_at` set; benefits feed (834) emits an `ENR` segment. |
| `WAIVED` | Beneficiary declined or the 60-day window expired | Workflow REJECTED or auto-EXPIRED. |
| `EXPIRED` | Election window passed without action | Driven by scheduled job; future task. |
| `TERMINATED_FOR_NONPAYMENT` | Carrier returned non-pay termination | Connector inbound feed updates row. |

The 60-day deadline is computed at insert time and persisted on
`election_deadline`. The COBRA election workflow is registered as a
`WorkflowDefinition` of kind `COBRA_ELECTION` so HR admins can configure the
notification path (HR specialist → benefits broker) without a code change.

## ACA reporting (1094-C / 1095-C)

ACA reporting reuses the existing `tax_year_documents` table:

* `taxFormCode = "1095-C"` per ALE Member, per employee.
* Lines 14 / 15 / 16 derived from finalised benefit enrollments + payroll
  totals for that calendar year.
* PDF and the corresponding 1094-C transmittal envelope are content-addressed.
* Generation is gated by an HR Director sign-off using a
  `WorkflowDefinition` of kind `CUSTOM` keyed by the ACA tax year. Status flips
  to `RELEASED` once the IRS AIR system returns an accepted transmission.

## 834 outbound feed

Carrier benefit feeds use ANSI X12 EDI **834** (Benefit Enrollment and
Maintenance). Generation lives in `packages/connectors/edi-834/` (Phase 2
implementation Task) and is driven by:

* A nightly batch reading `benefit_enrollments` deltas joined against
  `cobra_events`. Every emitted segment is reconciled with a mandatory
  `domain_outbox` event so the connector publisher is the only writer of the
  external file.
* Error handling: any parse failure on the carrier's 999 acknowledgement is
  routed through the workflow engine as a failed `WorkflowInstance` of kind
  `CUSTOM` (`CONNECTOR_FAILURE`), so HR admins can mark issues resolved
  without manual SQL.

## Acceptance criteria for the implementation Task

- [ ] COBRA notice deadline math validated against DOL §29 CFR 2590.606-4
      (with an explicit test vector covering a Feb-29 leap-year qualifying
      date).
- [ ] 834 segments validated against a published carrier test harness;
      golden segments stored under `packages/connectors/edi-834/__fixtures__/`.
- [ ] 1095-C generation deterministic for a given tax-year batch; reissue
      writes a new `taxYearDocument` and never mutates the prior PDF.
- [ ] All COBRA / ACA writes flow through `enqueueEvent` for downstream
      analytics + audit replay.
- [ ] No PII in event payloads beyond what is necessary; redaction utility
      lives next to [`lib/recruiting/redact.ts`](../../lib/recruiting/redact.ts)
      and is reused.
