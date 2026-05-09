# Security review — <feature slug>

## Threat notes (lite)

- External / internal abuse scenarios for this feature

## AuthN / AuthZ

- RBAC permissions required  
- ABAC attributes (tenant, org, manager chain, …)  
- **Deny default** for new routes

## Data protection

- PII fields; encryption at rest (field-level vs KMS); TLS 1.3 in transit  
- **Logging**: no PII/secrets; correlation ID only

## Database

- RLS/session vars plan (or defer with ADR + date)  
- Parameterized queries only

## Dependencies / secrets

- New packages justified; no secrets in repo  
- CI guards (if any) needed

## Merge blockers

- [ ] None — or list **must-fix** items

## Exception ADRs (if any)

- Link risk acceptance + expiry/revisit
