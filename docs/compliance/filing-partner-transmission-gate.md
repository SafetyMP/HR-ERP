# Filing partner transmission — counsel gate

**Status:** Required before production partner handoff  
**Brief:** [024-payroll-partner-export-connector](../../product/feature-briefs/024-payroll-partner-export-connector.md)  
**Related:** [reference-customer-exit-runbook](../../product/reference-customer-exit-runbook.md)

## Scope

HR ERP exports filing JSON artifacts and signed partner payloads via the **payroll partner connector**. This is **not** IRS e-file, HMRC RTI submission, or certified tax filing.

## Counsel checklist

| # | Item | Owner | Evidence |
| --- | --- | --- | --- |
| 1 | Partner agreement covers data transmission scope | Legal | Signed partner MSA or SOW |
| 2 | PII fields in export payload reviewed | Legal + Security | Payload schema in brief 018 artifact |
| 3 | Retention and breach notification for partner-held data | Legal | DPA addendum |
| 4 | Customer acknowledgment that agency filing remains partner responsibility | Customer success | Exit runbook sign-off row |

## Engineering transmission controls

- Partner credentials stored in `IntegrationInstance.encryptedTokenBundle` (AES-256-GCM).
- Outbound POST uses HMAC `X-HRERP-Signature-256` (ADR 0008 pattern).
- Idempotent `exportId` per period + partner config.
- Failed deliveries retry via BullMQ; terminal failures land in integration DLQ.

## SLA (reference customer)

| Step | Target |
| --- | --- |
| Period lock → artifact generation | Same business day |
| Partner export trigger | ≤3 clicks from locked period |
| Partner acknowledgment | Per partner contract (typically 1–2 business days) |

Counsel must confirm transmission before disabling manual CSV re-keying in customer runbooks.
