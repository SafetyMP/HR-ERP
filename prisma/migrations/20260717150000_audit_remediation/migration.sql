-- Audit remediation (2026-07-17):
-- 1) RLS on payroll_partner_exports
-- 2) Drop payroll → employee FKs (plain business ids for ADR 0012)
-- 3) domain_outbox for Kafka worker
-- 4) fx_snapshots.tenant_id + RLS

-- --- payroll_partner_exports RLS ---
ALTER TABLE "payroll_partner_exports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_partner_exports" FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payroll_partner_exports'
      AND policyname = 'payroll_partner_exports_tenant_isolation'
  ) THEN
    CREATE POLICY payroll_partner_exports_tenant_isolation ON "payroll_partner_exports"
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true))
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
  END IF;
END $$;

-- --- Drop cross-context FKs (employee_id remains as plain UUID/text) ---
ALTER TABLE "payment_instructions" DROP CONSTRAINT IF EXISTS "payment_instructions_employee_id_fkey";
ALTER TABLE "payroll_run_exceptions" DROP CONSTRAINT IF EXISTS "payroll_run_exceptions_employee_id_fkey";

-- --- domain_outbox (Phase-2 worker; safe IF NOT EXISTS for dual path) ---
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "domain_outbox" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "partition_key" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "headers" JSONB NOT NULL DEFAULT '{}'::JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "claimed_at" TIMESTAMPTZ NULL,
  "published_at" TIMESTAMPTZ NULL,
  CONSTRAINT domain_outbox_topic_chk CHECK (
    length(topic) > 0
    AND topic LIKE 'hr.%'
  )
);

CREATE INDEX IF NOT EXISTS idx_domain_outbox_unpublished ON "domain_outbox" ("created_at")
WHERE published_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_domain_outbox_stale_claim ON "domain_outbox" ("claimed_at")
WHERE published_at IS NULL AND claimed_at IS NOT NULL;

ALTER TABLE "domain_outbox" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "domain_outbox" FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'domain_outbox'
      AND policyname = 'domain_outbox_tenant_isolation'
  ) THEN
    CREATE POLICY domain_outbox_tenant_isolation ON "domain_outbox"
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true))
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
  END IF;
END $$;

-- --- FxSnapshot tenant scoping (Payroll-owned) ---
ALTER TABLE "fx_snapshots" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
CREATE INDEX IF NOT EXISTS "fx_snapshots_tenant_id_idx" ON "fx_snapshots"("tenant_id");

ALTER TABLE "fx_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fx_snapshots" FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fx_snapshots'
      AND policyname = 'fx_snapshots_tenant_isolation'
  ) THEN
    -- Shared catalog rows (tenant_id IS NULL) remain visible; tenant rows are isolated.
    CREATE POLICY fx_snapshots_tenant_isolation ON "fx_snapshots"
    FOR ALL
    USING (
      tenant_id IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)
    )
    WITH CHECK (
      tenant_id IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)
    );
  END IF;
END $$;
