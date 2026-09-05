# Security policy

HR ERP is an **HR scaffold for testing agent governance**. The tree includes payroll-shaped and ESS fixtures so tenancy and migration bugs have realistic blast radius. It is **not** a certified payroll vendor. Treat every report seriously and avoid sharing reproductions that contain real personally identifiable employee or payroll data—use **[synthetic fixtures](../docs/QA.md)** and redacted payloads only.

Canonical file: this page (`.github/SECURITY.md`). The root [`SECURITY.md`](../SECURITY.md) points here.

## Supported versions

| Version / line | Supported |
|----------------|------------|
| `main` (rolling) | Yes — security patches land here first |
| Latest GitHub Release tag | Supported while listed on the Releases page |

Older tags may receive critical fixes **at maintainers’ discretion**.

## Reporting a vulnerability

**Please do _not_ file public GitHub issues for undisclosed vulnerabilities** (doing so notifies all watchers immediately).

Preferred options (choose one):

1. **GitHub private vulnerability reporting** (enabled): open [`SafetyMP/HR-ERP`](https://github.com/SafetyMP/HR-ERP) → **Security → Report a vulnerability** (or use [the advisory form](https://github.com/SafetyMP/HR-ERP/security/advisories/new)).
2. If your organization maintains a coordinated disclosure inbox, route through that channel **and** open a private advisory on this repository so maintainers can collaborate in GitHub.

Include:

- A short summary and impact (confidentiality, integrity, availability, tenancy isolation).
- Minimal reproduction steps **without production PII** or customer exports.
- Affected surfaces (REST path, middleware, dependency, infra, governance hooks).
- Suggested remediation or patch direction (optional).

Maintainership will acknowledge receipt within a **few business days** where possible (flagship OSS best-effort) and coordinate a fix timeline and GitHub Security Advisory publication when appropriate.

## Scope (non-exhaustive)

In scope:

- Authentication and session handling (`middleware.ts`, JWT usage, tenant context).
- **Row-level isolation** regressions (`lib/security/**`, Prisma/session GUC posture).
- **SQL injection**, unsafe deserialization, SSRF-like callbacks in server code.
- **Dependency supply-chain** gaps that materially affect confidentiality or integrity of the fixture data plane.
- Agent-governance bypasses that skip `governance:ci` / verify and write fixture-domain data.

Typically out of scope (unless they chain into the above):

- Denial-of-service hypotheses without reproducible amplification.
- UI-only issues with no confidentiality / integrity boundary (use the public bug template instead).
- Social engineering targeting individuals.
- “This is not ERPNext-complete” feature gaps.

See also [`docs/security/`](../docs/security/) and [docs/DESIGN-PIVOT.md](../docs/DESIGN-PIVOT.md).

## Disclosure

We aim for coordinated disclosure:

- Maintainer prepares a minimal patch and CVE/advisory coordination as needed.
- Credit reporters in the advisory where they wish to be named.

Thank you for helping keep contributors and downstream fixture operators safer.
