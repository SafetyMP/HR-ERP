# Database migrations & state (pointer)

Canonical: [docs/architecture/database-migrations-and-state.md](../../../docs/architecture/database-migrations-and-state.md)

## Three surfaces

| Surface | Path |
|---------|------|
| App (Prisma) | `prisma/migrations/` |
| Core HR SQL | `services/core-hr/db/migrations/` |
| Payroll SQL | `services/payroll/db/migrations/` |

## Post-migrate

```bash
npm run db:verify
```

## Packaging (T2+)

- ADR 0003: distroless, GHCR, SBOM, Cosign
- Workflow: `.github/workflows/publish-ghcr.yml`
