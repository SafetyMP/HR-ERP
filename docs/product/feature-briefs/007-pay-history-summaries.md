# Feature brief: Pay history — finalized period summaries

**ID:** 007-pay-history-summaries  
**Status:** Implemented (MVP) · **Last updated:** 2026-05-09  

## PO gate

| Item | Answer |
|------|--------|
| **Primary user** | Employee verifying past pay or spotting missing corrections. |
| **Job-to-be-done** | See **historical finalized periods** with **gross** and **net** without exporting spreadsheets. |
| **Pain today** | Only latest statement visible (001); disputes stall on “find last PDF.” |
| **Outcome** | Faster reconciliation conversations with Payroll; fewer “send me every stub” tickets. |
| **Out of scope (v1)** | PDF export, line-level history drill-down per row, employer contributions ledger, W-2 / tax docs. |

## User acceptance criteria

1. From default landing, employee reaches **Pay history** in **≤2 navigational actions** (home link).
2. Each row shows **period start/end**, **gross**, **net**, **currency** when payroll posted a finalized instruction.
3. **Empty state** when only one or zero periods exist — no blank screen.
4. Copy clarifies **corrections appear as separate rows** when payroll reposts (high-level).
5. Recoverable errors without stack traces or raw DB tokens.
6. **Cross-link** from current earnings statement to history and back.

## Friction checks

- Scan prior periods in **under ~45 seconds** for seeded multi-period user.
