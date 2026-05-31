# Counsel track — W3 payroll trust and W7 benefits ops

**Status:** Active program gate  
**Audience:** Legal, Payroll ops, Benefits admin, Engineering  
**Win scorecard:** W3 (ownable policy) and W7 (benefits operational) in [stakeholder-value-plan.md](./stakeholder-value-plan.md)

Engineering ships **workflow and artifacts**; counsel signs **statutory and notice content** before production employee-facing claims.

---

## W3 — Production payroll policy (counsel + partner path)

| Step | Owner | Artifact | Exit criterion |
| --- | --- | --- | --- |
| 1 | Engineering | `packages/payroll-calc` golden vectors + `policyReleaseId` on pay runs | Fingerprint replay documented |
| 2 | Legal | Sign-off on [us-federal-withholding-placeholder.md](../compliance/us-federal-withholding-placeholder.md) checklist | Dated approval in compliance pack |
| 3 | Payroll ops | Partner export (Feature 024) as default filing path | Successful handoff in staging |
| 4 | Product | Feature brief **028** (partner filing UX + counsel package) PO-approved | UAC for HR ops demo — [028 brief](./feature-briefs/028-partner-filing-ux-counsel-package.md) |

**Do not claim:** IRS/HMRC certified in-app e-file. Buyer messaging: **partner handoff** from Feature 018 JSON artifacts.

**Engineering reference:** [ADR 0005](../../specs/alignment/decisions/0005-us-federal-withholding-v1.md), [018 filing artifact](./feature-briefs/018-in-house-payroll-close-and-filing-artifacts.md).

---

## W7 — Benefits operational (life events + COBRA + carrier)

| Step | Owner | Artifact | Exit criterion |
| --- | --- | --- | --- |
| 1 | Product | Feature **019** life events | Shipped — HR queue |
| 2 | Product | Feature **026** election change intent in-app | Employee → HR queue (not “outside the app”) |
| 3 | Legal | [cobra-aca-counsel-gate.md](../compliance/cobra-aca-counsel-gate.md) gates 1–4 | Memo or ticket IDs recorded |
| 4 | Engineering | COBRA notice PDF (Feature **027** after gate 3) | Counsel-reviewed template only — [027 brief](./feature-briefs/027-cobra-notice-pdf.md) PO approved, blocked on gates 1–4 |
| 5 | Integrations | Carrier outbound (025 stub → briefed connector) | Smoke proof; not full 834 until carrier validation |

**Current state:** Loss-of-coverage creates `PENDING_NOTICE` row; **notice PDF not shipped** until counsel gate clears.

---

## Program RACI (summary)

| Workstream | Responsible | Accountable | Consulted | Informed |
| --- | --- | --- | --- | --- |
| W3 tables + replay | Engineering | Payroll ops | Legal | Product |
| W3 partner filing | Payroll ops | Customer HR | Legal | Engineering |
| W7 election intent (026) | Engineering | Product | Benefits admin | Legal |
| W7 COBRA PDF (027) | Engineering | Legal | Benefits admin | Product |

---

## Tracking in stakeholder plan

Update **Track B OKRs** when counsel dates are known:

- `w3_counsel_signoff_date` — pending Legal sign-off on [us-federal-withholding-placeholder.md](../compliance/us-federal-withholding-placeholder.md)
- `w7_cobra_notice_state` — **`workflow_only`** (027 blocked on counsel gates 1–4)

See [stakeholder-value-plan.md §1b](./stakeholder-value-plan.md).
