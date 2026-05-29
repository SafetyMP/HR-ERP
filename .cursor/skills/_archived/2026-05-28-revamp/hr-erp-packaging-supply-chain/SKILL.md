---
name: hr-erp-packaging-supply-chain
description: >-
  Packaging and OCI supply-chain posture for HR ERP: distroless/minimal runtime
  images, multi-arch GHCR, SBOM and SLSA provenance attestations, Cosign keyless
  signing, lockfile discipline, and Wasm/OCI boundaries aligned with Innovation.
  Attach when changing Dockerfiles, Compose production paths, GitHub Actions
  publish workflows, or introducing containerized workers.
disable-model-invocation: true
---

# HR ERP packaging and supply chain (repo skill)

## Workspace grounding

Before citing paths, scripts, APIs, or dependencies for **this repo**, apply [workspace grounding](../README.md) against the active checkout—use Read/Grep (or search), not training-data defaults.

## Who must use this

**Lead Packaging / platform Tasks** and **Orchestrator-owned infra PRs** should load this skill (`@hr-erp-packaging-supply-chain`) when work touches:

| Context | Action |
|--------|--------|
| App/worker **Dockerfile** changes | Align with [**ADR 0003**](../../../specs/alignment/decisions/0003-container-supply-chain.md): distroless final stage where applicable, glibc-aligned builder for Prisma. |
| **GHCR** / **`publish-ghcr.yml`** | Preserve **multi-arch** `linux/amd64` + `linux/arm64`, **SBOM**, **provenance**, **Cosign** on digest. |
| **Compose** images for prod-like paths | Dev Compose may stay convenient; prod/release images remain minimal. |
| New **Rust / Wasm / OCI Wasm** bundles | Load **`hr-erp-innovation-rd`** (`@hr-erp-innovation-rd`) and read [`docs/architecture/03-wasm-rust-adoption-triggers.md`](../../../docs/architecture/03-wasm-rust-adoption-triggers.md): Wasm stays **sandboxed / preview / non-authoritative** for payroll and compliance totals. |

**Skill identifier:** `hr-erp-packaging-supply-chain` (frontmatter `name`).

## Canonical artifacts

| Topic | Location |
|------|----------|
| ADR | [`specs/alignment/decisions/0003-container-supply-chain.md`](../../../specs/alignment/decisions/0003-container-supply-chain.md) |
| Dockerfile | [`Dockerfile`](../../../Dockerfile) |
| Publish workflow | [`.github/workflows/publish-ghcr.yml`](../../../.github/workflows/publish-ghcr.yml) |
| Python CI pins | [`services/pipelines/requirements-ci.txt`](../../../services/pipelines/requirements-ci.txt) |

## Non-negotiables

- **Immutability / reproducibility:** Node → **`npm ci`** + committed **`package-lock.json`**. Python CI → **`requirements-ci.txt`** with explicit pins (transitives pinned as needed). Do not replace with floating `pip install` in CI.
- **Minimal runtime:** Production **Next.js** image final stage is **distroless Node** (`gcr.io/distroless/nodejs22-debian12:nonroot`) — no shell or package manager in the runtime layer.
- **Portability:** Release images ship as **OCI multi-platform** manifests (AMD64 + ARM64) under **one tag**.
- **Provenance:** Registry SBOM + SLSA-style **build provenance** attestations stay enabled on `docker/build-push-action` for this repo’s publish job unless ADR is superseded.
- **Signing:** **Cosign** keyless (GitHub OIDC) signs the **digest** after push; docs must show **verify** instructions for SecOps.
- **Wasm:** Packaging Wasm as OCI is allowed only when innovation gates and payroll authority rules are respected — never make Wasm the sole source of regulated pay totals.

## Handoff checklist (short)

- [ ] Builder libc/OpenSSL matches Prisma engines for **Debian 12** when using distroless Debian 12 runtime.
- [ ] `docker build` / CI matrix green for **both** architectures.
- [ ] **Cosign verify** command documented (README + ADR) with **identity / issuer** regexps appropriate to this repo’s path.
- [ ] Image size baseline noted when intentionally changing layers (FinOps).

## References

- [`hr-erp-innovation-rd`](../hr-erp-innovation-rd/SKILL.md) — Wasm / Edge / modernization gates.
- [`hr-erp-principal-architecture`](../hr-erp-principal-architecture/SKILL.md) — bounded contexts; future **outbox worker** image is a follow-up in ADR 0003.
