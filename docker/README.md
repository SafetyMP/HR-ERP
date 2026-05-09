# Docker packaging (GitHub / GHCR)

The production **`Dockerfile`** lives at the repository root (see [ADR 0003](../specs/alignment/decisions/0003-container-supply-chain.md): distroless Node, multi-arch).

## GitHub Container Registry

Images are published to **`ghcr.io/<lowercase github.repository>`** when a **GitHub Release** is published. Releases are created by [Semantic Release](../.github/workflows/semantic-release.yml) from [Conventional Commits](https://www.conventionalcommits.org/) on `main` / `master`.

Manual image tag (maintainers):

- Use **Actions → Publish container image → Run workflow** with a tag such as `0.2.0-rc.1`.

## Run locally with Compose

Default dev stack (Postgres + Redis) plus the app:

```bash
docker compose -f docker-compose.yml -f docker/compose.app.yml up -d --build app
```

Override the image to match a GHCR semver tag:

```bash
export HR_ERP_IMAGE="ghcr.io/myorg/hr-erp-scaffold:1.2.3"
docker compose -f docker-compose.yml -f docker/compose.app.yml up -d app
```

Set strong secrets for anything beyond local smoke tests.
