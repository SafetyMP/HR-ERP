# Payroll database migrations

Logical database: **`payroll`** (dedicated Postgres from `docker-compose.yml` when profile `architecture` is enabled).

Apply migrations:

```bash
psql "$PAYROLL_DATABASE_URL" -v ON_ERROR_STOP=1 -f services/payroll/db/migrations/V001__domain_outbox.sql
```

**Forbidden:** connecting this migration or service code to the Core HR DSN for writes.
