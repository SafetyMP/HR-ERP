# Feature brief: Partner filing UX and counsel package (W3)

**ID:** 028-partner-filing-ux-counsel-package  
**Status:** PO approved  
**Last updated:** 2026-05-30  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Payroll administrator closing a period and handing off to filing partner |
| **Job-to-be-done** | Complete **partner export** from locked period with counsel-documented messaging — no in-app e-file claims |
| **Pain today** | Filing JSON + partner export exist (018/024) but buyer demo lacks unified UX and counsel signoff tracking |
| **Outcome** | W3 production messaging: partner handoff is the default path; `w3_counsel_signoff_date` recorded |
| **Scope boundary** | Not IRS/HMRC live transmission; not W-2 PDF to employees |

---

## User acceptance criteria (UAC)

1. HR user on locked period sees **Export for partner** as primary filing action (links 018 artifact + 024 export).
2. UI copy states filing is **partner handoff**, not agency e-file — matches [us-federal-withholding-placeholder.md](../../compliance/us-federal-withholding-placeholder.md).
3. Export includes `policyReleaseId`, jurisdiction, and payload hash in confirmation panel.
4. Successful export logs partner handoff event (audit row or webhook — existing integration path).
5. Counsel checklist link visible in HR pay-run close flow.
6. **403** without payroll permissions — plain language.
7. Recoverable failures offer retry.
8. Playwright smoke: HR period detail → partner export download or success toast.

---

## Friction checks

- **Task-time target:** Payroll lead initiates partner export in under 30 seconds from period detail.
- **Errors:** Distinguish locked vs computed vs artifact-missing states.

**Program:** [counsel-track-w3-w7.md](../counsel-track-w3-w7.md) W3 step 4 · compliance [filing-partner-transmission-gate.md](../../compliance/filing-partner-transmission-gate.md).
