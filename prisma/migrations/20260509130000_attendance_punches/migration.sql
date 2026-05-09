-- Tenant RLS for attendance_punches.
-- Table, indexes, FK, and enum "PunchKind" already exist in baseline (00000000000000_baseline_integrations_platform).

ALTER TABLE "attendance_punches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_punches" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attendance_punches_tenant_isolation ON attendance_punches;

CREATE POLICY attendance_punches_tenant_isolation ON attendance_punches
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
