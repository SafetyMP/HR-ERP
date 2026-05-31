# Completion audit — Feature 027 (COBRA notice PDF)

**Audit date:** 2026-05-30  
**Denominator:** 8 numbered UAC (brief)  
**Result:** **Blocked — counsel gates 1–4** (0 / 8 engineering closure)

---

## Status

Feature **027** remains **PO approved — blocked on counsel gates 1–4** per [cobra-aca-counsel-gate.md](../../compliance/cobra-aca-counsel-gate.md).

| Gate | Status |
| --- | --- |
| 1 Qualifying event definitions | Pending Legal |
| 2 60-day election window | Pending Legal + Engineering |
| 3 1094-C / 1095-C mapping | Pending Legal |
| 4 834 segment rules | Pending Legal + Integrations |

**Track B state:** `w7_cobra_notice_state` = `workflow_only`

**Shipped today:** Loss-of-coverage creates `PENDING_NOTICE` workflow row (019 path). HR life event queue documents carrier delivery status; notice PDF generation is **not** implemented until counsel template is approved.

---

## Engineering readiness (when gates clear)

- Brief: [027-cobra-notice-pdf.md](../feature-briefs/027-cobra-notice-pdf.md)
- Target: HR opens `PENDING_NOTICE` row → **Generate notice PDF** (counsel template only)
- Do not ship ad-hoc statutory copy in application code
