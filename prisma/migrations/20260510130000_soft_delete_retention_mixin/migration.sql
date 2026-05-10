-- Soft-delete + retention mixin (ADR 0004).
-- Adds `deleted_at` and `retention_expires_at` to high-PII aggregates so the
-- retention/legal-hold worker can run scheduled hard purges without losing
-- audit history. All columns are NULLABLE; existing reads continue to work.

ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "retention_expires_at" TIMESTAMP(3);

ALTER TABLE "hr_case_requests"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "retention_expires_at" TIMESTAMP(3);

ALTER TABLE "benefit_enrollments"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "retention_expires_at" TIMESTAMP(3);

ALTER TABLE "tax_year_documents"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "retention_expires_at" TIMESTAMP(3);

-- Partial indexes accelerate the retention purge sweep without bloating live
-- query planning. Each scopes to rows already soft-deleted.
CREATE INDEX IF NOT EXISTS "employees_retention_expires_at_idx"
  ON "employees" ("retention_expires_at")
  WHERE "deleted_at" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "hr_case_requests_retention_expires_at_idx"
  ON "hr_case_requests" ("retention_expires_at")
  WHERE "deleted_at" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "benefit_enrollments_retention_expires_at_idx"
  ON "benefit_enrollments" ("retention_expires_at")
  WHERE "deleted_at" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "tax_year_documents_retention_expires_at_idx"
  ON "tax_year_documents" ("retention_expires_at")
  WHERE "deleted_at" IS NOT NULL;
