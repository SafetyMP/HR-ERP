# Feature brief: SCIM / IdP production hardening

**ID:** 023-scim-idp-production-hardening  
**Status:** PO approved  
**Last updated:** 2026-05-28  

## PO gate

| Item | Answer |
|------|--------|
| **Primary user / persona** | IT admin provisioning users from corporate IdP (Okta, Entra ID, Google Workspace) |
| **Job-to-be-done** | Provision and deprovision employees via SCIM 2.0 without manual HR data entry or Zapier |
| **Pain today** | SCIM API exists but lacks production runbook, rate limits, and buyer-verifiable UAC |
| **Outcome** | W6 partial → met for IdP connector; reference customer can sync users from IdP |
| **Scope boundary** | No full Rippling app store; no custom IdP UI beyond admin config API |

## User acceptance criteria (UAC)

1. `GET/POST/PATCH/DELETE /api/scim/v2/Users` enforce tenant isolation (RLS) under integration tests.
2. SCIM bearer token is tenant-scoped; cross-tenant user ID returns 404 not foreign data.
3. Admin can rotate SCIM token without downtime (document env + rotation runbook).
4. IdP sync creates or updates `Employee` + auth mapping with stable business IDs.
5. Deprovision sets employment status inactive; does not hard-delete audit-required rows.
6. Rate limit documented and enforced per tenant (429 with Retry-After).
7. Production checklist includes SCIM path; demo routes remain blocked.

## Friction checks

- IT admin finds SCIM base URL and auth requirements in runbook in ≤5 minutes.

## Stitched-stack pain row

| Pain | Outcome | UAC |
| --- | --- | --- |
| HR exports CSV to BambooHR for every hire | IdP pushes user to HR ERP via SCIM | 4, 5 |
