# Database migrations & state (pointer)

Canonical: [docs/architecture/database-migrations-and-state.md](../../../../docs/architecture/database-migrations-and-state.md)

These surfaces are a **high-risk fixture domain** (agent-governance blast radius), not a payroll product.

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
