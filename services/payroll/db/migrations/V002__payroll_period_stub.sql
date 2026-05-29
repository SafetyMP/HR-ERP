-- Payroll context schema stub (expand-migrate-contract). No cross-DB FKs to Core HR.
-- employee_id is a plain UUID issued by Core HR.

CREATE TABLE IF NOT EXISTS payroll_period (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payroll_period_tenant_idx ON payroll_period (tenant_id);
