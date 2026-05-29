# SCIM 2.0 provisioning

The HR ERP exposes an RFC 7644 SCIM 2.0 endpoint at `/api/scim/v2`. IdP directories
(Okta, Entra, OneLogin, Google Workspace, JumpCloud, WorkOS) can use it to provision,
update, and deprovision employee records.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/scim/v2/ServiceProviderConfig` | Capability discovery |
| GET | `/api/scim/v2/ResourceTypes` | Returns the `User` resource type |
| GET | `/api/scim/v2/Schemas` | Returns the `User` schema |
| GET | `/api/scim/v2/Users` | List + filter (`userName eq "x"`), paginated |
| POST | `/api/scim/v2/Users` | Create employee |
| GET | `/api/scim/v2/Users/{id}` | Read employee |
| PUT | `/api/scim/v2/Users/{id}` | Replace employee |
| PATCH | `/api/scim/v2/Users/{id}` | Replace `active`, `userName`, `name.givenName`, `name.familyName` |
| DELETE | `/api/scim/v2/Users/{id}` | Soft-deprovision (sets `INACTIVE` + `terminationDate`) |

## Authentication

Configure tenant-scoped bearer tokens via the `SCIM_TENANT_TOKENS` environment variable.
The value must be a JSON object keyed by tenant ID:

```json
{
  "tenant_acme": { "token": "scim_live_2025_random_64_byte_secret_xxx" },
  "tenant_globex": { "token": "scim_live_2025_random_64_byte_secret_yyy" }
}
```

Tokens must be at least 24 characters. They are compared with constant-time equality.
Rotate quarterly and source from a secrets manager (Vercel sensitive env, AWS Secrets
Manager, Doppler, etc.). The token grants tenant-scoped admin authority over the SCIM
endpoint **only**; it cannot read paystubs or other ABAC-gated resources.

### Zero-downtime rotation

During rotation, include both tokens in the JSON entry:

```json
{
  "tenant_acme": {
    "token": "scim_live_NEW_secret",
    "previousToken": "scim_live_OLD_secret"
  }
}
```

Deploy the new token first with `previousToken` set to the outgoing value. After IdP
confirms the new token, remove `previousToken` on the next deploy.

### Rate limiting

Default: **120 requests/minute/tenant** (`SCIM_RATE_LIMIT_PER_MINUTE` override).
Exceeded limits return **429** with `Retry-After` header.

## Mapping

| SCIM | Employee column |
| --- | --- |
| `userName` | `email` |
| `name.givenName` | `firstName` |
| `name.familyName` | `lastName` |
| `active` | `status` (`ACTIVE` / `TERMINATED`) |
| `meta.created` / `meta.lastModified` | `createdAt` / `updatedAt` |

SCIM provisioning also upserts a `UserAccount` row (email + `employee` role) for IdP-linked login.

## Limitations (today)

- Bulk operations are not supported.
- Group provisioning is not implemented; role assignment continues to flow through
  `UserRoleAssignment` and the JWKS-issued JWT.
- ETag / `If-Match` is not implemented; concurrent updates last-write-win.
- The PATCH parser handles a small set of paths suitable for Okta and Entra; expand
  it as additional IdPs are exercised.
