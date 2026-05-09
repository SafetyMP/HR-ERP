# Core HR database migrations

Logical database: **`core_hr`** (Postgres instance from `docker-compose.yml` when profile `architecture` is enabled).

Apply migrations (example):

```bash
psql "$CORE_HR_DATABASE_URL" -v ON_ERROR_STOP=1 -f services/core-hr/db/migrations/V001__domain_outbox.sql
```

Do **not** add foreign keys to tables owned by Payroll or other contexts.
