# Security policy

HR ERP touches **regulated HR and payroll semantics** under the hood. Treat every report seriously and avoid sharing reproductions that contain real personally identifiable employee or payroll data—use **[synthetic fixtures](docs/QA.md)** and redacted payloads only.

## Supported versions

| Version / line | Supported |
|----------------|------------|
| `main` (rolling) | Yes — security patches land here first |
| Latest GitHub Release tag | Supported while listed on the Releases page |

Older tags may receive critical fixes **at maintainers’ discretion**.

## Reporting a vulnerability

**Please do _not_ file public GitHub issues for undisclosed vulnerabilities** (doing so notifies all watchers immediately).

Preferred options (choose one):

1. **GitHub private vulnerability reporting**: open the repo on GitHub and use **Security → Report a vulnerability** if enabled for [`SafetyMP/HR-ERP`](https://github.com/SafetyMP/HR-ERP).
2. If your organization maintains a coordinated disclosure inbox, route through that channel **and** request the maintainer to enable GitHub advisory collaboration.

Include:

- A short summary and impact (confidentiality, integrity, availability, tenancy isolation).
- Minimal reproduction steps **without production PII** or customer exports.
- Affected surfaces (REST path, middleware, dependency, infra).
- Suggested remediation or patch direction (optional).

Maintainership will acknowledge receipt within a **few business days** where possible (flagship OSS best-effort) and coordinate a fix timeline and GitHub Security Advisory publication when appropriate.

## Scope (non-exhaustive)

In scope:

- Authentication and session handling (`middleware.ts`, JWT usage, tenant context).
- **Row-level isolation** regressions (`lib/security/**`, Prisma/session GUC posture).
- **SQL injection**, unsafe deserialization, SSRF-like callbacks in server code.
- **Dependency supply-chain** gaps that materially affect confidentiality or integrity of HR data planes.

Typically out of scope (unless they chain into the above):

- Denial-of-service hypotheses without reproducible amplification.
- UI-only issues with no confidentiality / integrity boundary (use the public bug template instead).
- Social engineering targeting individuals.

See also [`docs/security/`](docs/security/).

## Disclosure

We aim for coordinated disclosure:

- Maintainer prepares a minimal patch and CVE/advisory coordination as needed.
- Credit reporters in the advisory where they wish to be named.

Thank you for helping keep contributors and downstream HR teams safer.
