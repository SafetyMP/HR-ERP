# Feature brief: Benefits carrier outbound stub

**ID:** 025-benefits-carrier-outbound-stub  
**Status:** PO approved  
**Last updated:** 2026-05-28  

## PO gate

| Item | Answer |
|------|--------|
| **Primary user / persona** | Benefits administrator notifying carrier of life-event enrollment changes |
| **Job-to-be-done** | Send structured enrollment change event to carrier webhook/API stub without 834 EDI v1 |
| **Pain today** | Life events (019) update internal rows only; no carrier notification path |
| **Outcome** | W6 connector #3; W7 partial improvement; full 834 deferred per counsel |
| **Scope boundary** | No production 834 EDI; stub JSON envelope + HMAC webhook only; COBRA notice PDF still counsel-gated |

## User acceptance criteria (UAC)

1. Approved life event emits `benefits.enrollment.changed` domain event.
2. Integration worker delivers outbound payload to configured carrier webhook URL.
3. Payload includes tenant ID, employee business ID, event type, effective date — no full SSN.
4. Delivery uses same HMAC + encryption patterns as ADR 0008 webhooks.
5. Admin can configure carrier endpoint per tenant (ABAC `integrations:configure`).
6. DLQ + replay documented for failed carrier deliveries.
7. Counsel gate documented: stub is **not** certified 834 until separate brief.

## Friction checks

- Benefits admin sees delivery status on life-event detail within one refresh.

## Stitched-stack pain row

| Pain | Outcome | UAC |
| --- | --- | --- |
| Benefits admin emails carrier CSV after every life event | Automated outbound stub on approval | 1, 2 |

## Dependencies

- Brief [019](./019-benefits-life-events-mvp.md)
- [cobra-aca-counsel-gate.md](../../compliance/cobra-aca-counsel-gate.md)
