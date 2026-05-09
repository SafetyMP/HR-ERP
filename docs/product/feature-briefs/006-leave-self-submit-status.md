# Feature brief: Leave — submit multi-day request & view status

**ID:** 006-leave-self-submit-status  
**Status:** Implemented (MVP) · **Last updated:** 2026-05-09  

## PO gate

| Item | Answer |
|------|--------|
| **Primary user** | Benefit-eligible employee coordinating planned absence; HR reduces unstructured email. |
| **Job-to-be-done** | Submit a **date range** request and see **pending / approved / denied** without calling HR first. |
| **Pain today** | Leave balances visible (005) but no structured submit path; employees flood Slack/email. |
| **Outcome** | Fewer informal threads; status transparency before payroll posting. |
| **Out of scope (v1)** | Manager approval UI, calendar conflict engine, partial-day rules, jurisdiction-specific leave types, automatic balance deduction. |

## User acceptance criteria

1. From **Your PTO**, the employee can reach submit + list of requests **without leaving** `/employee/pto` (≤2 clicks from home via **PTO**).
2. POST accepts **start date**, **end date** (inclusive), optional note; rejects ranges **over 14 calendar days** or inverted ranges (plain-language errors via API envelope).
3. GET lists the employee’s submissions **newest first** with readable **status** labels in UI.
4. Dedicated UI when **permission missing** (cannot submit electronically).
5. Load failures show **retry** without exposing internal codes.
6. Demo seed includes at least one **PENDING** and one **APPROVED** row for QA visibility.

## Friction checks

- Form understandable without HR glossary; mobile-friendly date inputs.
- Empty list uses supportive copy.
