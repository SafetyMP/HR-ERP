-- Row Level Security (tenant isolation) — session GUCs set per transaction in application code.
-- Requires: SET LOCAL equivalents via set_config('app.tenant_id', ..., true).

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees FORCE ROW LEVEL SECURITY;

ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks FORCE ROW LEVEL SECURITY;

ALTER TABLE integration_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_instances FORCE ROW LEVEL SECURITY;

ALTER TABLE integration_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_outbox FORCE ROW LEVEL SECURITY;

ALTER TABLE integration_dead_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_dead_letters FORCE ROW LEVEL SECURITY;

ALTER TABLE webhook_event_dedupe ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_event_dedupe FORCE ROW LEVEL SECURITY;

ALTER TABLE employee_vendor_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_vendor_links FORCE ROW LEVEL SECURITY;

-- employees: single-tenant row scope
CREATE POLICY employees_tenant_isolation ON employees
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

-- onboarding_tasks: inherited via parent employee
CREATE POLICY onboarding_tasks_tenant_isolation ON onboarding_tasks
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.id = onboarding_tasks.employee_id
      AND e.tenant_id = current_setting('app.tenant_id', true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.id = onboarding_tasks.employee_id
      AND e.tenant_id = current_setting('app.tenant_id', true)
  )
);

CREATE POLICY integration_instances_tenant_isolation ON integration_instances
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

-- Rows without tenant_id become invisible (fail closed) under RLS.
CREATE POLICY integration_outbox_tenant_isolation ON integration_outbox
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY integration_dead_letters_tenant_isolation ON integration_dead_letters
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY webhook_event_dedupe_tenant_isolation ON webhook_event_dedupe
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY employee_vendor_links_tenant_isolation ON employee_vendor_links
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.id = employee_vendor_links.employee_id
      AND e.tenant_id = current_setting('app.tenant_id', true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.id = employee_vendor_links.employee_id
      AND e.tenant_id = current_setting('app.tenant_id', true)
  )
);

-- Optional: QA migration may create `pto_requests` before this migration (see sibling folder).
DO $$
BEGIN
  IF to_regclass('public.pto_requests') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE pto_requests ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE pto_requests FORCE ROW LEVEL SECURITY';
    EXECUTE $rls$
      CREATE POLICY pto_requests_tenant_isolation ON pto_requests
      FOR ALL
      USING (tenant_id = current_setting('app.tenant_id', true))
      WITH CHECK (tenant_id = current_setting('app.tenant_id', true))
    $rls$;
  END IF;
END $$;
