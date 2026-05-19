# Feature brief: Talent depth — interviews and performance reviews

**ID:** 020-talent-depth-wave  
**Status:** PO approved  
**Last updated:** 2026-05-18  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Hiring manager scheduling interviews; employee and manager completing performance reviews in an open cycle. |
| **Job-to-be-done** | **Schedule interviews** and capture a **scorecard** on applicants; **self and manager review** with ratings in the active performance cycle. |
| **Pain today** | 014 pipeline has stages only; 015 has goals only; `PerformanceReviewV2` exists in schema without API/UI. |
| **Outcome** | Standard reqs avoid a third ATS login; review cycle usable beyond goal lists. |
| **Scope boundary** (explicitly out of scope) | Greenhouse-grade scheduling, 9-box calibration UI, compensation cycle integration, AI screening automation. |

---

## User acceptance criteria (UAC)

1. On a requisition pipeline, hiring manager can **add an interview** (date, type) for an applicant.
2. Manager can **complete a scorecard** (rating + notes) and mark interview **completed**.
3. Employee opens **My review** for the open cycle and submits **self-rating** and **self note**.
4. Manager opens **Team reviews** and submits **manager rating** and **note** for a direct report.
5. Reviews are tied to the **open performance cycle**; closed cycle returns **409** on new submissions.
6. **403** for principals without recruiting/performance permissions—plain language.
7. List views show **empty states** when no interviews or reviews exist.
8. Recoverable load failures offer **retry**.

---

## Friction checks

- **Task-time target:** Schedule interview in **under 45 seconds** on pipeline page.
