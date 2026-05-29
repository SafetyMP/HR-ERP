# ADR 0014 — Spike: GitHub OSS governance & CI alignment

**Status:** Accepted (spike)  
**Phase:** aligns with Phase 1 product scope boundaries per [0001-phase1-scope](./0001-phase1-scope.md) — governance only  

## Context

The repository intends flagship open-source hygiene: community documentation, repeatable CI, Dependabot posture, consolidated Actions spend, documented branch protection expectations, optional container releases, and Vercel deploy hardening narratives.

This ADR intentionally **does not** introduce employee-facing product **UAC** (user acceptance criteria).

## Decision

Treat platform / OSS governance batches as **spike-aligned work**:

- Artifact: root `SECURITY.md`, `CODE_OF_CONDUCT.md`, consolidated workflows, `.github/` templates, `.github/CODEOWNERS`, Dependabot configuration, CHANGELOG/release automation scaffolding, Dockerfile + GHCR publishing, maintainer-facing branch protection docs.
- **Friction target:** Contributor path stays **under ~10 minutes** to find “how we work” (`README` → `CONTRIBUTING` → `SECURITY`/`CODE_OF_CONDUCT`); Actions minute budget favors **single quality gate off default branch merges** plus one deploy pipeline.

Out of scope for this spike: product Features, payroll correctness changes, migrations to production tenancy models.

## Consequences

- Maintainers MUST complete GitHub **Settings → Rules / Environments** per `docs/community/github-branch-protection.md` (not representable purely in Git).
- **CODEOWNERS** `@SafetyMP/…` team slugs must be created/replaced before automatic review routing works reliably.
- Vercel **OIDC** tokenless deploy remains **tracked as roadmap** until vendor workflow is GA; **`VERCEL_TOKEN`** rotation cadence documented in ops docs until then.

## UAC count

**0 (spike)** — no numbered employee UX acceptance criteria.
