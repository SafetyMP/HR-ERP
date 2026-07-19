-- ADR 0021: Core HR catalog schema — CatalogStatus, Department.parentId,
-- required Department.code, unique (tenant, name) / (tenant, title).

CREATE TYPE "CatalogStatus" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "departments"
  ADD COLUMN "parent_id" TEXT,
  ADD COLUMN "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "job_roles"
  ADD COLUMN "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE';

-- Backfill null/blank codes to deterministic unique values per row.
UPDATE "departments"
SET "code" = 'DEP-' || LEFT(REPLACE("id", '-', ''), 8)
WHERE "code" IS NULL OR BTRIM("code") = '';

-- Deduplicate codes within a tenant (keep earliest created_at, then id).
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, code
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM departments
)
UPDATE departments d
SET code = d.code || '-dup' || ranked.rn::text
FROM ranked
WHERE d.id = ranked.id AND ranked.rn > 1;

-- Deduplicate department names within a tenant before unique index.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, name
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM departments
)
UPDATE departments d
SET name = d.name || ' (' || ranked.rn::text || ')'
FROM ranked
WHERE d.id = ranked.id AND ranked.rn > 1;

-- Deduplicate job role titles within a tenant before unique index.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, title
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM job_roles
)
UPDATE job_roles j
SET title = j.title || ' (' || ranked.rn::text || ')'
FROM ranked
WHERE j.id = ranked.id AND ranked.rn > 1;

ALTER TABLE "departments" ALTER COLUMN "code" SET NOT NULL;

ALTER TABLE "departments"
  ADD CONSTRAINT "departments_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "departments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "departments_tenant_id_name_key"
  ON "departments"("tenant_id", "name");

CREATE INDEX "departments_tenant_id_parent_id_idx"
  ON "departments"("tenant_id", "parent_id");

-- Replace non-unique (tenant, title) index with a unique constraint index.
DROP INDEX IF EXISTS "job_roles_tenant_id_title_idx";
CREATE UNIQUE INDEX "job_roles_tenant_id_title_key"
  ON "job_roles"("tenant_id", "title");
