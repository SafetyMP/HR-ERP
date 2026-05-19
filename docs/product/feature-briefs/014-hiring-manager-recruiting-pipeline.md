# Feature brief: Hiring manager — requisition & applicant pipeline

**ID:** 014-hiring-manager-recruiting-pipeline  
**Status:** PO approved  
**Last updated:** 2026-05-18  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Hiring manager and HR recruiter coordinating req-to-hire without a separate ATS for mid-market (500–5k). |
| **Job-to-be-done** | Create and track **job requisitions**, move **candidates** through pipeline stages, and extend an **offer** from one product surface. |
| **Pain today** | Recruiting APIs exist (`/api/v1/recruiting/*`) but no manager UI; hiring runs in spreadsheets or a point ATS disconnected from Core HR. |
| **Outcome** | Faster time-to-fill visibility; fewer “where is this candidate?” pings to HR; auditable stage transitions. |
| **Scope boundary** (explicitly out of scope) | Public career site, OFCCP/EEO reporting, background checks, e-sign offers, AI screening production (governance), agency/contractor hiring. |

---

## Empathy / process

Hiring managers are judged on open roles while juggling day jobs. They need a **single pipeline view** per requisition—not API docs or demo hub seeds. Stage moves must feel irreversible only when appropriate (reject/withdraw), with plain language when HR policy blocks a transition.

---

## Personas & scenarios

1. **Given** a hiring manager with `recruiting:requisition_write` **when** they open **Open roles** **then** they see active requisitions with title, status, and opening count.
2. **Given** an open requisition **when** the manager opens the applicant list **then** each application shows candidate label, current **stage**, and applied date.
3. **Given** an application in **SCREENING** **when** the manager advances to **INTERVIEW** **then** the stage persists and appears on refresh without email round-trips.

---

## Prioritization rationale

Mid-market competitive gap #1 after Phase 1 self-service: backend and Prisma models are done; cost is mostly UI on existing routes. Defers full ATS compliance until internal workflow is usable.

---

## User acceptance criteria (UAC)

1. Hiring manager (or HR with equivalent permission) opens **Recruiting** from the home hub in **≤2 intentional navigational actions**.
2. Authenticated user can **list requisitions** via UI calling `GET /api/v1/recruiting/requisitions` with status filter; empty state explains no open roles.
3. User can **create a requisition** via UI calling `POST /api/v1/recruiting/requisitions` with title, openings, and optional location/employment type; success shows new row or navigates to detail.
4. User can open a requisition detail showing **applications** from `GET /api/v1/recruiting/requisitions/{id}/applications` (or list endpoint pattern in OpenAPI).
5. User can **advance application stage** via UI calling `PATCH /api/v1/recruiting/applications/{id}/stage` for at least **SCREENING → INTERVIEW → OFFER**; UI shows updated stage without raw error codes.
6. User can **create and extend an offer** via UI using `POST /api/v1/recruiting/offers` and `POST /api/v1/recruiting/offers/{id}/extend` where policy allows; forbidden paths show plain-language copy.
7. **403** when principal lacks recruiting permissions—no stack traces or internal codes in employee-facing chrome.
8. Recoverable load failures offer **retry**; **5xx** messages stay plain language.

---

## Friction checks

- **Task-time target:** Manager locates a candidate’s current stage in **under 30 seconds** after landing on Recruiting (excluding auth).
- **Empty / no data state:** “No open requisitions” with hint to create one or contact HR.
- **Errors:** Plain language; user knows whether to retry, pick another role, or contact HR.

---

## Notes for Frontend

- Routes: `/manager/recruiting` (list), `/manager/recruiting/requisitions/[id]` (pipeline). Reuse `hrApiFetch`, `useHrAccess`, `HrSignInCard` patterns from paystub.
- Stage labels: **Applied**, **Screening**, **Interview**, **Offer**, **Hired**, **Rejected**, **Withdrawn** (map API enums).
- Link to **capability hub** only as secondary “admin/debug” footer in non-production, not primary IA.

## API references (existing)

- `GET|POST /api/v1/recruiting/requisitions`
- `GET /api/v1/recruiting/requisitions/{id}`
- `GET /api/v1/recruiting/requisitions/{id}/applications`
- `POST /api/v1/recruiting/applications`
- `PATCH /api/v1/recruiting/applications/{id}/stage`
- `POST /api/v1/recruiting/offers`, `POST /api/v1/recruiting/offers/{id}/extend`
