# ADR 0003: Container runtime, multi-arch OCI, and supply-chain attestations

**Date:** 2026-05-09  
**Status:** Accepted  
**Tags:** security, supply-chain, containers, ci

## Context

Production images must be **minimal** (reduced attack surface), **portable** across enterprise hardware (AMD64 and ARM64), and **verifiable** (SBOM, build provenance, cryptographic signing). The web app ships as a single OCI image to GHCR today; Node dependencies are lockfile-pinned, but Python ML smoke jobs used floating `pip install`, and the prior runtime used a full Alpine base with shell and package manager.

Innovation posture already limits **Wasm** to sandboxed, non-authoritative use (see [`docs/architecture/03-wasm-rust-adoption-triggers.md`](../../../docs/architecture/03-wasm-rust-adoption-triggers.md)); packaging must not weaken that boundary.

## Decision

1. **Production runtime:** The Next.js release image **final stage** uses **Google distroless Node** (`gcr.io/distroless/nodejs22-debian12`, **`nonroot`** variant): no shell, no `apt`/`apk`, no build toolchain. **Build stages** use **Debian Bookworm / glibc** (`node:22-bookworm-slim`) so Prisma native engines and OpenSSL align with the distroless Debian 12 runtime.
2. **Multi-architecture OCI:** Published images are **multi-platform manifest lists** with at least **`linux/amd64`** and **`linux/arm64`**, published under a **single tag** (Buildx).
3. **Attestations:** CI enables **SBOM** and **SLSA-style build provenance** attestations via `docker/build-push-action` (linked to the image in the registry).
4. **Signing:** Every push to GHCR is **Cosign-signed** (keyless, GitHub OIDC) against the **image digest** (manifest index digest for multi-arch), not only a mutable tag.
5. **Reproducibility:** Node installs in containers and CI use **`npm ci`** with a committed **`package-lock.json`**; semver ranges in `package.json` are allowed only when the lockfile remains the source of truth for resolved versions. Python CI dependencies use a **fully pinned** `services/pipelines/requirements-ci.txt`. Future Rust/Wasm artifacts must use **`Cargo.lock`** and a **documented/pinned toolchain** per [`03-wasm-rust-adoption-triggers.md`](../../../docs/architecture/03-wasm-rust-adoption-triggers.md).
6. **Wasm / OCI Wasm:** Evaluate Wasm + OCI Wasm packaging **only** for workloads that pass innovation gates (lightweight transforms, previews). **Never** ship Wasm as the sole authority for regulated payroll totals or compliance math without server recompute.
7. **Image size / FinOps:** After the distroless migration, record a **baseline compressed size** (e.g. from `docker buildx imagetools inspect` or workflow metadata). CI may emit a **warning** when size drifts above an agreed threshold; **hard fail** on size is optional and requires a recorded baseline (not enabled by default).

## Consequences

**Positive:** Smaller effective attack surface on the runtime, consistent cross-arch pulls, registry-verifiable SBOM/provenance, Cosign verification for admission controllers and SecOps.

**Negative / trade-offs:** Multi-arch builds consume more CI time; distroless complicates ad hoc `docker exec` debugging (use debug images or local dev Compose only); Prisma/OpenSSL compatibility must stay aligned with Debian 12.

**Operational:** Operators verify images with Cosign before deploy; cluster policy can require signed digests. Local dev remains **`docker compose`** and **`npm run dev`**; Compose service images are not required to be distroless.

## Alternatives considered

1. **Keep Alpine final stage** — rejected: conflicts with “no package manager / minimal attack surface” goal; musl also complicates alignment if switching to glibc-based distroless.
2. **Chainguard / Wolfi images** — viable later; Google distroless is chosen for broad familiarity and Node 22 alignment.
3. **Separate SBOM tool (Syft) only** — deferred; Buildx SBOM + provenance covers the primary registry-native path; Syft can be added if SPDX/CycloneDX files must be archived as CI artifacts.

## Implementation notes

- App image: root [`Dockerfile`](../../../Dockerfile).
- Publish workflow: [`.github/workflows/publish-ghcr.yml`](../../../.github/workflows/publish-ghcr.yml) (triggered by published GitHub Releases from [`.github/workflows/semantic-release.yml`](../../../.github/workflows/semantic-release.yml)).
- Compose overlay for local/GHCR pulls: [`docker/compose.app.yml`](../../../docker/compose.app.yml).
- Python CI pins: [`services/pipelines/requirements-ci.txt`](../../../services/pipelines/requirements-ci.txt).
- **Cosign verify** — use the **`sha256:DIGEST`** of the pushed manifest (from the workflow log, GHCR UI, or `docker buildx imagetools inspect`). Adjust `OWNER/REPO` to the lower-case `github.repository` slug:

```bash
cosign verify "ghcr.io/OWNER/REPO@sha256:DIGEST" \
  --certificate-identity-regexp '^https://github.com/OWNER/REPO/\.github/workflows/publish-ghcr\.yml@.*' \
  --certificate-oidc-issuer-regexp '^https://token.actions.githubusercontent.com$'
```

Releases (`refs/tags/...`) and **`workflow_dispatch`** builds both match `publish-ghcr.yml@.*`; tightening the regexp is optional once your org standardizes refs.

- **Follow-up:** Containerize [`workers/outbox-publisher/`](../../../workers/outbox-publisher/) with a **distroless Node** (or **static binary**) image; production entry should run **`node`** on a compiled/bundled file, not `tsx`.

## References

- [`0001-postgres-kafka-context-boundaries.md`](0001-postgres-kafka-context-boundaries.md)
- [`docs/architecture/03-wasm-rust-adoption-triggers.md`](../../../docs/architecture/03-wasm-rust-adoption-triggers.md)
- Project skill: [`.cursor/skills/hr-erp-packaging-supply-chain/SKILL.md`](../../../.cursor/skills/hr-erp-packaging-supply-chain/SKILL.md)
