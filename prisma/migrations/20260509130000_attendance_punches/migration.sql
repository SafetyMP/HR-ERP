-- Attendance punches — server-authoritative timestamps; idempotent writes per tenant.

CREATE TYPE "PunchKind" AS ENUM ('CLOCK_IN', 'CLOCK_OUT');

CREATE TABLE "attendance_punches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "kind" "PunchKind" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'api_v1',
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_punches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attendance_punches_tenant_id_idempotency_key_key" ON "attendance_punches"("tenant_id", "idempotency_key");

CREATE INDEX "attendance_punches_tenant_id_employee_id_occurred_at_idx" ON "attendance_punches"("tenant_id", "employee_id", "occurred_at" DESC);

ALTER TABLE "attendance_punches" ADD CONSTRAINT "attendance_punches_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance_punches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_punches" FORCE ROW LEVEL SECURITY;

CREATE POLICY attendance_punches_tenant_isolation ON attendance_punches
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
